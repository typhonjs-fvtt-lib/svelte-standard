<script>
   /**
    * Provides a pre-configured slotted button interfacing w/ the Foundry file picker. You may assign a child component
    * that obtains the `filepath` store.
    *
    * Please see {@link FVTTFilePickerBrowseOptions} for the `pickerOptions` prop.
    * Please see {@link TJSSlotButton} for the button component / CSS variable support.
    *
    *
    * This component provides one way binding by default. You may explicitly bind to the `filepath` prop to create a
    * two-way binding.
    *
    * @componentDocumentation
    */

   import {
      createEventDispatcher,
      setContext }                  from '#svelte';
   import { writable }              from '#svelte/store';

   import { isObject }              from '#runtime/util/object';
   import { isWritableStore }       from '#runtime/util/store';

   import { FVTTFilePickerControl } from '#standard/application';
   import { TJSSlotButton }         from '#standard/component';

   export let filepath = '';

   export let button = void 0;

   /** @type {import('#standard/application').FVTTFilePickerBrowseOptions} */
   export let pickerOptions = void 0;

   const dispatch = createEventDispatcher();

   const storeFilepath = writable(filepath);
   setContext('filepath', storeFilepath);

   // ----------------------------------------------------------------------------------------------------------------

   $: pickerOptions = isObject(button) && isObject(button.pickerOptions) ? button.pickerOptions :
    isObject(pickerOptions) ? pickerOptions : void 0;

   // When filepath changes from internal / external set any pickerOptions store and invoke any `onFilepath` callback.
   $: if (filepath?.length)
   {
      // Set context store.
      $storeFilepath = filepath;

      if (isWritableStore(pickerOptions?.store)) { pickerOptions.store.set(filepath); }

      if (typeof pickerOptions?.onFilepath === 'function') { pickerOptions.onFilepath({ filepath });}

      dispatch('filepath', { filepath });
   }

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Invokes the Foundry file picker.
    *
    * @param {CustomEvent} event - MouseEvent.
    */
   async function invokePicker(event)
   {
      // Bring any existing file picker to the top and on success return immediately as this is a successive invocation.
      if (typeof pickerOptions?.id === 'string' && FVTTFilePickerControl.bringToTop(pickerOptions?.id)) { return; }

      // Locate any parent glasspane in order to promote the file picker app to the associated container.
      const glasspaneEl = event.detail?.event?.target?.closest('.tjs-glass-pane');

      // Add any glasspane ID to `pickerOptions`.
      const options = isObject(pickerOptions) ? { ...pickerOptions, glasspaneId: glasspaneEl?.id } :
       { glasspaneId: glasspaneEl?.id };

      // Result is null when the user cancels / closes the file picker app.
      const result = await FVTTFilePickerControl.browse(options, event.detail?.event);

      if (result)
      {
         let validated = true;

         if (typeof pickerOptions?.onValidate === 'function')
         {
            validated = await pickerOptions.onValidate({ filepath: result });
            if (typeof validated !== 'boolean')
            {
               console.warn(`FVTTFilePickerBrowseOptions.onValidate warning: 'onValidate' did not return a boolean.`);
               return;
            }
         }

         if (validated) { filepath = result; }
      }
   }
</script>

<TJSSlotButton on:press={invokePicker} {...$$props}>
    <slot />
</TJSSlotButton>
