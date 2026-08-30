<script>
   /**
    * `TJSDataField` provides a reactive Svelte wrapper around Foundry VTT {@link fvtt!DataField} instances,
    * supporting dynamic DataField changes, bindable stores, and automatic synchronization between DataField cleaned
    * values and store-specific runtime representations when required.
    *
    * By supplying `groupConfig` the form group is created {@link fvtt!FormGroupConfig}
    * where you may specify the `label`, `hint`, and `units` or additional configuration like `stacked`.
    *
    * Review {@link TJSDataFieldOptions} for a detailed description of optional configuration.
    *
    * @privateRemarks
    * Note: Value adapters, {@link valueAdapters}, are configured when the effective DataField or bindable store
    * changes. If the underlying store value later transitions to a different runtime representation while the same
    * store instance remains bound, the adapter is not reconfigured. This is currently intentional, as value
    * representation is determined when the DataField / store pairing is established.
    *
    * @componentDocumentation
    */

   import { writable }                 from '#svelte/store';

   import {
      PropBindingControl,
      PropChangeTracker }              from '#runtime/svelte/reactivity';

   import { isMinimalWritableStore }   from '#runtime/svelte/store/util';

   import {
      hasSetter,
      isObject }                       from '#runtime/util/object';

   import {
      isBoolean,
      isFunction,
      resolveByPredicate }             from '#runtime/util/predicate';

   import { CrossRealm }               from '#runtime/util/realm';

   import {
      isDataField,
      isDataModelValidationFailure }   from '#runtime/types/fvtt-shim/predicate';

   import { Hashing }                  from '#runtime/util';

   /**
    * @import { MinimalWritable }         from '#runtime/svelte/store/util';
    *
    * @import {
    *    TJSDataFieldOptions,
    *    TJSDataFieldValidationCallback}  from './types';
    */

   /**
    * Combined configuration object for all props.
    *
    * Individual props take precedence over corresponding properties defined in `input`.
    *
    * @type {TJSDataFieldOptions | undefined}
    */
   export let input = void 0;

   /**
    * The associated Foundry DataField.
    *
    * @type {fvtt.DataField | undefined}
    */
   export let datafield = void 0;

   /**
    * Whether the associated input is enabled.
    *
    * @type {boolean | undefined}
    */
   export let enabled = void 0;

   /**
    * Optional configuration used when constructing a DataField form group.
    *
    * @type {fvtt.FormGroupConfig | undefined}
    */
   export let groupConfig = void 0;

   /**
    * Optional configuration used when constructing the associated DataField input element.
    *
    * @type {fvtt.FormInputConfig<unknown> | undefined}
    */
   export let inputConfig = void 0;

   /**
    * Callback invoked when DataField validation fails while processing user input or synchronizing an existing store
    * value with a changed DataField.
    *
    * @type {TJSDataFieldValidationCallback | undefined}
    */
   export let onValidationFailure = void 0;

   /**
    * When true and the effective DataField changes, synchronize the store to that field’s initial value. When no
    * valid DataField is available, synchronize the store to undefined.
    *
    * When false, the existing store value is preserved across DataField changes whenever it remains compatible with
    * the new DataField. Otherwise, the store is synchronized to the initial value of the new DataField.
    *
    * @type {boolean | undefined}
    */
   export let resetInitial = void 0;

   /**
    * Writable store synchronized with the DataField value.
    *
    * The component automatically updates the store when user input changes and reacts to external store updates by
    * synchronizing with the hosted DataField.
    *
    * @type {MinimalWritable<unknown> | undefined}
    */
   export let store = void 0;

   /**
    * Tracks effective properties that require reconstruction of the hosted Foundry element.
    *
    * The `undefined` initial mode preserves the prior first-check semantics of uninitialized local snapshots.
    *
    * @type {PropChangeTracker<TJSDataFieldOptions, 'datafield' | 'enabled' | 'groupConfig' | 'inputConfig'>}
    */
   const constructionChangeTracker = new PropChangeTracker({
      keys: ['datafield', 'enabled', 'groupConfig', 'inputConfig'],
      initialMode: 'undefined'
   });

   /**
    * @type {(value: unknown) => unknown}
    */
   const identityFn = (value) => value;

   /**
    * Effective resolved component properties.
    *
    * @type {TJSDataFieldOptions}
    */
   const props = {
      datafield: void 0,
      enabled: true,
      groupConfig: void 0,
      inputConfig: void 0,
      onValidationFailure: void 0,
      resetInitial: false
   };

   /**
    * Potentially converts cleaned values from the data field to match the underlying store value. Also provides
    * store sync conversion for validation testing.
    *
    * Currently, this is just a special case for the Foundry Color instance as ColorField represents the color string.
    * If the store value is initially a Color instance when it is updated `fromCleaned` will translate a color string
    * back to a Color instance. See {@link configureValueAdapter} which is invoked when either the effective DataField
    * or bindable store changes.
    *
    * @type {{ fromCleaned: (value: unknown) => unknown, fromStore: (value: unknown) => unknown }}
    */
   const valueAdapters = {
      fromCleaned: identityFn,
      fromStore: identityFn
   };

   /**
    * Resolves the effective store while preserving values published through the bindable `store` property.
    */
   const storeControl = new PropBindingControl(isMinimalWritableStore, writable(void 0));

   /**
    * Normalized combined component options.
    *
    * @type {TJSDataFieldOptions}
    */
   let inputOptions = {};

   /**
    * When a data field input is mounted this references the active input source element.
    *
    * @type {HTMLElement | undefined}
    */
   let activeFieldEl;

   /**
    * Stores the associated container element. This is usually a div element, but the core `code-mirror` web component
    * specifically requires a form element.
    *
    * @type {HTMLDivElement | HTMLFormElement | undefined}
    */
   let containerEl;

   /**
    * Sets the `svelte:element` tag for the appropriate container element.
    *
    * @type {'div' | 'form'}
    */
   let containerTag = 'div';

   /**
    * Defines an error message to display inline when misconfigured.
    *
    * @type {string | undefined}
    */
   let errorMessage;

   /**
    * Tracks whether the active field element is a custom web component.
    */
   let isCustomEl = false;

   /**
    * Any defined `rootId` from `groupConfig`; otherwise a generated unique ID.
    */
   let uniqueId = createUniqueId();

   /**
    * Describes the latest request to reconstruct the hosted Foundry element.
    */
   let reloadRequest = { revision: 0, datafieldChanged: false };

   /**
    * Invalidates stale asynchronous mount callbacks.
    */
   let mountGeneration = 0;

   /**
    * Normalize the combined input separately from resolution of the individual exported props.
    */
   $: inputOptions = isObject(input) ? input : {};

   /**
    * Resolve effective props. Valid individual props take precedence over values supplied through `input`.
    */
   $: {
      props.datafield = resolveByPredicate(isDataField, datafield, inputOptions.datafield);
      configureValueAdapter();
   }

   $: props.enabled = resolveByPredicate(isBoolean, enabled, inputOptions.enabled) ?? true;

   $: props.groupConfig = resolveByPredicate(isObject, groupConfig, inputOptions.groupConfig);

   $: props.inputConfig = resolveByPredicate(isObject, inputConfig, inputOptions.inputConfig);

   $: props.onValidationFailure = resolveByPredicate(isFunction, onValidationFailure, inputOptions.onValidationFailure);

   $: props.resetInitial = resolveByPredicate(isBoolean, resetInitial, inputOptions.resetInitial) ?? false;

   $: {
      store = storeControl.resolve(store, inputOptions.store);
      configureValueAdapter();
   }

   /*
    * The container tag is derived exclusively from the effective DataField.
    *
    * Changing `containerTag` causes Svelte to replace the `svelte:element`. The new `containerEl` binding then causes
    * the current reload request to be processed against the new container.
    */
   $: containerTag = requiresFormContainer(props.datafield) ? 'form' : 'div';

   /**
    * Only construction properties trigger reconstruction.
    *
    * - DataField changes.
    * - Enabled state changes.
    * - Group configuration changes.
    * - Input configuration changes.
    *
    * `store` and `resetInitial` changes do not independently reconstruct the element.
    */
   $: {
      const changes = constructionChangeTracker.check(props);

      if (changes.changed)
      {
         if (changes.has('groupConfig')) { uniqueId = createUniqueId(); }

         errorMessage = void 0;

         requestReload(changes.has('datafield'));
      }
   }

   /**
    * Process the latest construction request whenever both a request and a current container are available.
    *
    * This also reruns when Svelte replaces the container because its tag changes between `div` and `form`.
    */
   $: if (containerEl && reloadRequest.revision > 0) { loadPayloadEl(reloadRequest, containerEl); }

   /**
    * Store value changes update the existing active element directly rather than reconstructing it.
    */
   $: if (activeFieldEl !== void 0) { setValue($store); }

   /**
    * Configures value adaptation between cleaned DataField values and the current store representation.
    *
    * When a DataField uses a runtime representation different from its cleaned value this method selects an
    * appropriate adapter so values written back to the store preserve the original representation.
    *
    * Presently, only `Color` coercion is handled with ColorField. If the store currently holds a Color instance this
    * method selects an adapter to convert color strings back to Color instances. If the store holds a color string
    * then it stays a color string.
    *
    * This method is invoked when the effective DataField or bindable store changes.
    */
   function configureValueAdapter()
   {
      valueAdapters.fromCleaned = identityFn;
      valueAdapters.fromStore = identityFn;

      const storeValue = $store;

      if (props.datafield instanceof foundry.data.fields.ColorField && isObject(storeValue) &&
       storeValue instanceof foundry.utils.Color)
      {
         valueAdapters.fromCleaned = (value) => foundry.utils.Color.from(value);
         valueAdapters.fromStore = (value) => isObject(value) && value instanceof foundry.utils.Color ?
          value.toString() : value;
      }
   }

   /**
    * @returns {string} Uses any defined `rootId` from `groupConfig`; otherwise creates a random ID.
    */
   function createUniqueId()
   {
      return typeof props.groupConfig?.rootId === 'string' ? props.groupConfig.rootId : `unique-${Hashing.uuidv4()}`;
   }

   /**
    * Determines whether an element is a custom element.
    *
    * @param {HTMLElement | undefined} element - Element to test.
    *
    * @returns {boolean}
    */
   function isCustomElement(element)
   {
      return typeof element?.tagName === 'string' && element.tagName.includes('-');
   }

   /**
    * Determines whether an asynchronous mount operation is still current.
    *
    * @param {number} generation - Mount generation being checked.
    *
    * @param {HTMLDivElement | HTMLFormElement} targetContainer - Original target container.
    *
    * @returns {boolean}
    */
   function isCurrentMount(generation, targetContainer)
   {
      return generation === mountGeneration && targetContainer === containerEl;
   }

   /**
    * Creates and mounts a standalone DataField input.
    *
    * @param {unknown} currentValue - Current input value.
    *
    * @param {HTMLDivElement | HTMLFormElement} targetContainer - Container receiving the input.
    *
    * @param {number} generation - Current mount generation.
    */
   function loadDataFieldEl(currentValue, targetContainer, generation)
   {
      /** @type {HTMLElement | undefined} */
      let datafieldEl;

      try
      {
         datafieldEl = props.datafield.toInput(Object.assign({ disabled: !props.enabled }, props.inputConfig ?? {},
            { value: currentValue }));
      }
      catch (err)
      {
         errorMessage = typeof err?.message === 'string' ? err.message : String(err);
         console.warn(err);
      }

      if (!datafieldEl)
      {
         resetContainer(targetContainer);
         return;
      }

      requestAnimationFrame(() =>
      {
         if (!isCurrentMount(generation, targetContainer)) { return; }

         targetContainer.replaceChildren(datafieldEl);

         activeFieldEl = datafieldEl;
         isCustomEl = isCustomElement(activeFieldEl);
      });
   }

   /**
    * Dynamically loads the associated input element for the current DataField.
    *
    * @param {{ revision: number, datafieldChanged: boolean }} request - Current reload request.
    *
    * @param {HTMLDivElement | HTMLFormElement} targetContainer - Container receiving the element.
    */
   function loadPayloadEl(request, targetContainer)
   {
      const generation = ++mountGeneration;

      activeFieldEl = void 0;
      isCustomEl = false;

      if (!isDataField(props.datafield))
      {
         resetContainer(targetContainer);

         // No DataField present potentially reset store.
         if (request.datafieldChanged && props.resetInitial && $store !== void 0) { $store = void 0; }

         return;
      }

      if (!props.datafield.constructor.hasFormSupport)
      {
         resetContainer(targetContainer);

         // Potentially sync store to initial value of the DataField even though it can't be displayed.
         if (request.datafieldChanged && props.resetInitial)
         {
            const initialValue = props.datafield.getInitialValue();
            const nextStoreValue = valueAdapters.fromCleaned(initialValue);

            if ($store !== nextStoreValue) { $store = nextStoreValue; }
         }

         errorMessage = `No input element for \`${props.datafield.constructor.name}\`.`;

         return;
      }

      const storeValue = $store;

      errorMessage = void 0;

      let cleanValue;

      if (request.datafieldChanged && props.resetInitial)
      {
         cleanValue = props.datafield.getInitialValue();

         const nextStoreValue = valueAdapters.fromCleaned(cleanValue);

         if (storeValue !== nextStoreValue) { $store = nextStoreValue; }
      }
      else  // Handle `resetInitial` false case verifying store synchronization after validation.
      {
         cleanValue = props.datafield.clean(storeValue);

         if (request.datafieldChanged)
         {
            const validationFailureClean = props.datafield.validate(cleanValue, { fallback: false });

            const validationFailureStore = props.datafield.validate(valueAdapters.fromStore(storeValue),
             { fallback: false });

            // Check store failure first then fallback to clean value failure.
            const syncFailure = isDataModelValidationFailure(validationFailureStore) ? validationFailureStore :
             isDataModelValidationFailure(validationFailureClean) ? validationFailureClean : void 0;

            if (syncFailure)
            {
               cleanValue = props.datafield.getInitialValue();

               const nextStoreValue = valueAdapters.fromCleaned(cleanValue);

               if (storeValue !== nextStoreValue) { $store = nextStoreValue; }

               props.onValidationFailure?.(syncFailure, { source: 'sync' });
            }
         }
      }

      if (isObject(props.groupConfig))
      {
         loadFormGroupEl(cleanValue, targetContainer, generation);
      }
      else
      {
         loadDataFieldEl(cleanValue, targetContainer, generation);
      }
   }

   /**
    * Creates and mounts a DataField form group.
    *
    * @param {unknown} currentValue - Current input value.
    *
    * @param {HTMLDivElement | HTMLFormElement} targetContainer - Container receiving the form group.
    *
    * @param {number} generation - Current mount generation.
    */
   function loadFormGroupEl(currentValue, targetContainer, generation)
   {
      /** @type {HTMLElement | undefined} */
      let formGroupEl;

      try
      {
         formGroupEl = props.datafield.toFormGroup(Object.assign({}, props.groupConfig, { rootId: uniqueId }),
          Object.assign({ disabled: !props.enabled }, props.inputConfig ?? {}, { value: currentValue }));
      }
      catch (err)
      {
         errorMessage = typeof err?.message === 'string' ? err.message : String(err);
         console.warn(err);
      }

      if (!formGroupEl)
      {
         resetContainer(targetContainer);
         return;
      }

      requestAnimationFrame(() =>
      {
         if (!isCurrentMount(generation, targetContainer)) { return; }

         targetContainer.replaceChildren(formGroupEl);

         // Find the element that has a CSS ID that starts with the unique ID.
         let activeEl;

         const elements = targetContainer.querySelectorAll(`[id^="${CSS.escape(uniqueId)}"]`);

         for (const element of elements)
         {
            if (hasSetter(element, 'value'))
            {
               activeEl = element;
               break;
            }
         }

         activeFieldEl = activeEl;

         isCustomEl = isCustomElement(activeFieldEl);
      });
   }

   /**
    * Handles changes emitted by the active Foundry input.
    *
    * @param {Event} event - Change event.
    */
   function onChange(event)
   {
      try
      {
         const eventTarget = event.target;

         if (!CrossRealm.browser.isHTMLElement(eventTarget)) { return; }

         if (!isDataField(props.datafield)) { return; }

         const eventTargetType = /** @type {HTMLInputElement} */ (eventTarget).type;

         // Foundry custom web components do not set event target type for their own change event. Ignore change events
         // originating from internal native inputs.
         if (isCustomEl && typeof eventTargetType === 'string') { return; }

         const eventValue = eventTargetType === 'checkbox' ? /** @type {HTMLInputElement} */ (eventTarget).checked :
          /** @type {HTMLInputElement} */ (eventTarget).value;

         // Clean may sanitize some bad user input, but not outright validation failure.
         const cleanValue = props.datafield.clean(eventValue);

         const validationFailure = props.datafield.validate(cleanValue, { fallback: false });

         if (isDataModelValidationFailure(validationFailure))
         {
            // Set old store value on failure.
            setValue($store);

            props.onValidationFailure?.(validationFailure, { source: 'user' });
         }
         else
         {
            $store = valueAdapters.fromCleaned(cleanValue);

            // Sync the control with the canonical value returned by `clean`. This will be ignored if same value
            // otherwise will reset the control if the value has been cleaned, but differs from UI state.
            setValue(cleanValue);
         }
      }
      catch (err)
      {
         console.warn(err);
      }
   }

   /**
    * Creates a new element reconstruction request.
    *
    * @param {boolean} datafieldChanged - Whether the effective DataField changed.
    */
   function requestReload(datafieldChanged)
   {
      reloadRequest = { revision: reloadRequest.revision + 1, datafieldChanged };
   }

   /**
    * Determines whether a DataField requires a form container.
    *
    * @param {fvtt.DataField | undefined} value - DataField to test.
    *
    * @returns {boolean}
    */
   function requiresFormContainer(value)
   {
      return value instanceof foundry.data.fields.JavaScriptField || value instanceof foundry.data.fields.JSONField;
   }

   /**
    * Resets state and removes child content from the given container.
    *
    * @param {HTMLDivElement | HTMLFormElement | undefined} [targetContainer] Container to clear.
    */
   function resetContainer(targetContainer = containerEl)
   {
      activeFieldEl = void 0;
      isCustomEl = false;

      targetContainer?.replaceChildren();
   }

   /**
    * Updates the value of the active data field element after validation.
    *
    * @param {unknown} uncleanValue - Uncleaned value to set.
    */
   function setValue(uncleanValue)
   {
      if (!activeFieldEl || !props.datafield) { return; }

      try
      {
         const cleanValue = props.datafield.clean(uncleanValue);

         if (activeFieldEl.value === cleanValue) { return; }

         const validationFailure = props.datafield.validate(cleanValue, { fallback: false });

         if (isDataModelValidationFailure(validationFailure)) { return; }

         if (typeof activeFieldEl._setValue === 'function')
         {
            activeFieldEl._setValue(cleanValue);
         }
         else
         {
            activeFieldEl.value = cleanValue ?? '';
         }

         if (typeof activeFieldEl._refresh === 'function') { activeFieldEl._refresh(); }
      }
      catch (err)
      {
         console.warn(err);
      }
   }
</script>

{#if errorMessage}
   <div class="tjs-panel-content tjs-panel-content--flex-row tjs-content-error">{errorMessage}</div>
{:else}
   <!-- The core `code-mirror` web component specifically searches for the closest form. -->
   <svelte:element
      this={containerTag}
      class="tjs-content-datafield standard-form"
      bind:this={containerEl}
      on:change|preventDefault|stopPropagation={onChange}
   />
{/if}

<style lang=css>
   .tjs-content-datafield {
      flex: var(--tjs-content-datafield-flex, 1);
      width: var(--tjs-content-datafield-width, 100%);
   }

   .tjs-content-error {
      background: var(--tjs-content-error-background);
      border-color: var(--tjs-content-error-border-color);
      color: var(--tjs-content-error-color);
      padding: var(--tjs-content-gap-half, 0.5rem);
   }
</style>
