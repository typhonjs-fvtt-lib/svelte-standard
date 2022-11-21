<script>
   // import type { RgbaColor, HsvaColor, Colord } from 'colord';

   import {
      onDestroy,
      setContext }          from 'svelte';

   import { colord }        from '@typhonjs-fvtt/runtime/color/colord';

   import { applyStyles }   from '@typhonjs-svelte/lib/action';
   import { isObject }      from '@typhonjs-svelte/lib/util';

   import { InternalState } from './model/InternalState.js';

   import {
      ArrowKeyHandler,
      Input,
      MainLayout }          from './base/index.js'

   /**
    * color properties
    */
   export let color = void 0;

   /**
    * User settable options / customization properties.
    *
    * @type {TJSColordPickerOptions}
    */
   export let options = void 0;

   const internalState = new InternalState(color, options);

   setContext('#tjs-color-picker-state', internalState);

   const {
      components,
      isAlpha,
      isPopup,
      isTextInput
   } = internalState.stores;

   const colorState = internalState.colorState;

   const {
      hslString,
      hslHueString,
      hslaString,
      currentColor
   } = colorState.stores;

   onDestroy(() => internalState.destroy());

   /** @type {object} */
   $: styles = isObject(options) && isObject(options.styles) ? options.styles : void 0;

   // When options changes update internal state.
   $: internalState.updateOptions(options);

   $: color = $currentColor;

   // When `color` prop changes detect if it is an external change potentially updating internal state.
   $: if (!colord($currentColor).isEqual(color)) { colorState.updateExternal(color); }

   /** @type {HTMLSpanElement} */
   let spanEl = void 0;

   /**
    * @param {KeyboardEvent}    e -
    */
   function keydown(e)
   {
      if (e.key === 'Tab')
      {
         spanEl.classList.add('has-been-tabbed');
      }
   }

   /**
    * @param {KeyboardEvent}    e -
    */
   function keyup(e)
   {
      if (e.key === 'Tab' && $isPopup)
      {
         internalState.isOpen = spanEl?.contains(document.activeElement);
      }
   }
</script>

<ArrowKeyHandler/>

<svelte:window on:keydown={keydown} on:keyup={keyup}/>

<span bind:this={spanEl}
      class=tjs-color-picker
      style:--_tjs-color-picker-current-color-hsl={$hslString}
      style:--_tjs-color-picker-current-color-hsl-hue={$hslHueString}
      style:--_tjs-color-picker-current-color-hsla={$hslaString}
      use:applyStyles={styles}>
    <input type=hidden value={$hslaString}/>
    {#if $isPopup}
        <Input />
    {/if}
    <MainLayout />
</span>

<style>
    span {
        position: relative;
    }
</style>