<script>
   /**
    * `TJSSettingsSwap` provides a convenience component to swap a main slotted component with `TJSSettingsEdit`.
    *
    * The component props are the same and documented in {@link TJSSettingsEdit}. The only difference is that to
    * support slot forwarding for `TJSSettingsEdit` is that you define the `settings-header` and `settings-footer` slots
    * inside the `TJSSettingsSwap` content.
    *
    * Controlling the swap state is accessible from `TJSGameSettingsWithUI.uiControl.showSettings` accessor
    * (get or set). This allows for instance the creation of an app header button to swap between the main slotted
    * component and `TJSSettingsEdit`.
    *
    * @componentDocumentation
    */

   import TJSSettingsEdit from './TJSSettingsEdit.svelte';

   /** @type {import('#standard/store/fvtt/settings').TJSGameSettingsWithUI} */
   export let settings = void 0;

   /** @type {import('#standard/store/fvtt/settings').TJSSettingsCreateOptions} */
   export let options = void 0;

   const showSettings = settings.uiControl.stores.showSettings;
</script>

{#if $showSettings}
    <TJSSettingsEdit {settings} {options}>
        <slot name=settings-header slot=settings-header {settings} {options} {uiSettings} let:uiSettings />
        <slot name=settings-footer slot=settings-footer {settings} {options} {uiSettings} let:uiSettings />
    </TJSSettingsEdit>
{:else}
    <slot/>
{/if}
