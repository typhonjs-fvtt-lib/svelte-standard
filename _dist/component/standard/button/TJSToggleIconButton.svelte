<script>
   /**
    * --tjs-icon-button-background
    * --tjs-icon-button-background-hover
    * --tjs-icon-button-background-selected
    * --tjs-icon-button-border-radius
    * --tjs-icon-button-clip-path
    * --tjs-icon-button-clip-path-hover
    * --tjs-icon-button-clip-path-selected
    * --tjs-icon-button-diameter
    * --tjs-icon-button-transition
    */
   import { applyStyles }     from '@typhonjs-fvtt/runtime/svelte/action';
   import { isWritableStore } from '@typhonjs-fvtt/runtime/svelte/store';
   import { localize }        from '@typhonjs-fvtt/runtime/svelte/helper';

   export let button = void 0;
   export let icon = void 0;
   export let title = void 0;
   export let titleSelected = void 0;
   export let store = void 0;
   export let styles = void 0;
   export let efx = void 0;
   export let onClickPropagate = void 0;
   export let onClosePropagate = void 0;

   $: icon = typeof button === 'object' && typeof button.icon === 'string' ? button.icon :
    typeof icon === 'string' ? icon : '';
   $: title = typeof button === 'object' && typeof button.title === 'string' ? button.title :
    typeof title === 'string' ? title : '';
   $: titleSelected = typeof button === 'object' && typeof button.titleSelected === 'string' ? button.titleSelected :
    typeof titleSelected === 'string' ? titleSelected : '';
   $: store = typeof button === 'object' && isWritableStore(button.store) ? button.store : isWritableStore(store) ?
    store : void 0;
   $: styles = typeof button === 'object' && typeof button.styles === 'object' ? button.styles :
    typeof styles === 'object' ? styles : void 0;
   $: efx = typeof button === 'object' && typeof button.efx === 'function' ? button.efx :
    typeof efx === 'function' ? efx : () => {};

   $: onClosePropagate = typeof button === 'object' && typeof button.onClosePropagate === 'boolean' ? button.onClosePropagate :
    typeof onClosePropagate === 'boolean' ? onClosePropagate : false;
   $: onClickPropagate = typeof button === 'object' && typeof button.onClickPropagate === 'boolean' ? button.onClickPropagate :
    typeof onClickPropagate === 'boolean' ? onClickPropagate : false;

   let selected = false;

   $: if (store) { selected = $store; }

   // Chose the current title when `selected` changes; if there is no `titleSelected` fallback to `title`.
   $: titleCurrent = selected && titleSelected !== '' ? titleSelected : title

   function onClick(event)
   {
      selected = !selected;
      if (store) { store.set(selected); }

      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * In this case we can't set pointer-events: none for the div due to the slotted component, so process clicks on the
    * div in respect to onClickPropagate.
    *
    * @param {MouseEvent} event -
    */
   function onClickDiv(event)
   {
      if (!onClickPropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }

   /**
    * Handles `close` event from any children elements.
    */
   function onClose(event)
   {
      selected = false;
      if (store) { store.set(false); }

      if (!onClosePropagate)
      {
         event.preventDefault();
         event.stopPropagation();
      }
   }
</script>

<div on:close on:click
     on:click={onClickDiv}
     on:close={onClose}
     title={localize(titleCurrent)}
     use:applyStyles={styles}>
   <a on:click={onClick} use:efx class:selected>
      <i class={icon} class:selected></i>
   </a>
   {#if selected}
      <slot/>
   {/if}
</div>

<style>
   div {
      display: block;
      position: relative;
      flex: 0 0 var(--tjs-icon-button-diameter);
      height: var(--tjs-icon-button-diameter);
      width: var(--tjs-icon-button-diameter);
      align-self: center;
      text-align: center;
   }

   a {
      pointer-events: initial;
      display: inline-block;
      background: var(--tjs-icon-button-background);
      border-radius: var(--tjs-icon-button-border-radius);
      position: relative;
      overflow: hidden;
      clip-path: var(--tjs-icon-button-clip-path, none);
      transform-style: preserve-3d;
      width: 100%;
      height: 100%;
      transition: var(--tjs-icon-button-transition);
   }

   a:hover {
      background: var(--tjs-icon-button-background-hover);
      clip-path: var(--tjs-icon-button-clip-path-hover, var(--tjs-icon-button-clip-path, none));
   }

   a.selected {
      background: var(--tjs-icon-button-background-selected);
      clip-path: var(--tjs-icon-button-clip-path-selected, var(--tjs-icon-button-clip-path, none));
   }

   i {
      line-height: var(--tjs-icon-button-diameter);
      transform: translateZ(1px);
   }
</style>
