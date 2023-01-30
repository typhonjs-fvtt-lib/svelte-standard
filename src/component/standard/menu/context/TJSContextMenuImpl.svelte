<script>
   /**
    * TJSContextMenuImpl provides a context menu implementation component that is not meant to be directly used as it is
    * controlled as a single browser wide context menu from {@link TJSContextMenu} that is imported via:
    * `import { TJSContextMenu } from '@typhonjs-fvtt/svelte-standard/application';` The front end for
    * TJSContextMenuImpl processes data and invokes / manages a single context menu.
    *
    * TJSContextMenuImpl supports a flexible data driven way to construct the menu items with the same format as
    * {@link TJSMenu}. Depending on the item data that is passed into the menu you can define 4 types of items:
    * 'icon / label', 'image / label', 'class / Svelte component', and 'separator / hr'. The main difference is that
    * TJSContextMenu does not support default or named slots.
    *
    * ----------------------------------------------------------------------------------------------------------------
    * Exported props include:
    * `menu` ({@link TJSMenuData}): An object defining all properties of a menu.
    *
    * Or in lieu of passing the folder object you can assign these props directly:
    * `items`: An iterable list of {@link TJSContextMenuItemData}; defines data driven menu items.
    * `styles`: Styles to be applied inline via `applyStyles` action.
    * `efx`: Currently unused; for any future action effects.
    * `keyCode`: The key code to activate menu items.
    * `focusSource`: A `A11yFocusSource` object containing the target element to return focus to on close.
    * `transitionOptions`: Custom transition options for duration and easing function.
    *
    * ----------------------------------------------------------------------------------------------------------------
    * Events: There is a single that is fired and _not_ bubbled up through parent elements:
    * `close`- Fired when the menu closes allowing {@link TJSContextMenu} to clean up resources.
    *
    * ----------------------------------------------------------------------------------------------------------------
    * Styling: To style this component use `.tjs-context-menu` as the base selector.
    *
    * There are several local CSS variables that you can use to change the appearance dynamically. Either use
    * CSS props or pass in a `styles` object w/ key / value props to set to the details. The default fallback variables
    * target both TJSMenu and TJSContextMenu. The few `popover` defaults target components that independently pop over
    * other elements browser wide.
    *
    * The following CSS variables are supported, but not defined by default.
    * --tjs-context-menu-background - fallback: --tjs-default-menu-background; default: #23221d
    * --tjs-context-menu-border - fallback: --tjs-default-menu-border; default: 1px solid #000
    * --tjs-context-menu-border-radius - fallback: --tjs-default-menu-border-radius; default: 5px
    * --tjs-context-menu-box-shadow - fallback: --tjs-default-popover-box-shadow; default: 0 0 2px #000
    * --tjs-context-menu-color - fallback: --tjs-default-menu-color; default: #eee
    * --tjs-context-menu-max-width - fallback: --tjs-default-menu-max-width; default: 360px
    * --tjs-context-menu-min-width - fallback: --tjs-default-menu-min-width; default: 20px
    *
    * The following CSS variables define attributes for the data driven menu items.
    *
    * All menu items:
    * --tjs-context-menu-item-line-height - fallback: --tjs-default-menu-item-line-height; default: 2em
    * --tjs-context-menu-item-padding - fallback: --tjs-default-menu-item-padding; default: 0 0.5em 0 0
    *
    * Icon / Image menu items (considered a button item):
    * --tjs-context-menu-item-button-gap - fallback: --tjs-default-menu-item-button-gap; default: 0.25em
    * --tjs-context-menu-item-color-focus-hover - fallback: --tjs-default-color-focus-hover; default: #fff
    * --tjs-context-menu-item-text-shadow-focus-hover - fallback: --tjs-default-text-shadow-focus-hover; default: 0 0 8px red
    *
    * Specific targeting for the label of button items (allows control of wrapping / set `white-space` to `nowrap`):
    * --tjs-context-menu-item-label-overflow - fallback: --tjs-default-menu-item-label-overflow; default: hidden
    * --tjs-context-menu-item-label-text-overflow - fallback: --tjs-default-menu-item-label-text-overflow; default: ellipsis
    * --tjs-context-menu-item-label-white-space - fallback: --tjs-default-menu-item-label-white-space; default: undefined
    *
    * Icon menu item:
    * --tjs-context-menu-item-icon-width - fallback: --tjs-default-menu-item-icon-width; default: 1.25em
    *
    * Image menu item:
    * --tjs-context-menu-item-image-width - fallback: --tjs-default-menu-item-image-width; default: 1.25em
    * --tjs-context-menu-item-image-height - fallback: --tjs-default-menu-item-image-height; default: 1.25em
    *
    * Separator / HR:
    * --tjs-context-menu-hr-margin - fallback: --tjs-default-hr-margin; default: 0 0.25em
    * --tjs-context-menu-hr-border-top - fallback: --tjs-default-hr-border-top; default: 1px solid #555
    * --tjs-context-menu-hr-border-bottom - fallback: --tjs-default-hr-border-bottom; default: 1px solid #444
    *
    * The following CSS variables define the keyboard / a11y focus indicator for menu items:
    * --tjs-context-menu-focus-indicator-align-self - fallback: --tjs-default-focus-indicator-align-self; default: stretch
    * --tjs-context-menu-focus-indicator-background - fallback: --tjs-default-focus-indicator-background; default: white
    * --tjs-context-menu-focus-indicator-border - fallback: --tjs-default-focus-indicator-border; default: undefined
    * --tjs-context-menu-focus-indicator-border-radius - fallback: --tjs-default-focus-indicator-border-radius; default: 0.1em
    * --tjs-context-menu-focus-indicator-height - fallback: --tjs-default-focus-indicator-height; default: undefined
    * --tjs-context-menu-focus-indicator-width - fallback: --tjs-default-focus-indicator-width; default: 0.25em
    */

   import {
      createEventDispatcher,
      onMount }                     from 'svelte';

   import { current_component }     from 'svelte/internal';

   import { applyStyles }           from '@typhonjs-svelte/lib/action';
   import { localize }              from '@typhonjs-svelte/lib/helper';
   import { slideFade }             from '@typhonjs-svelte/lib/transition';

   import {
      A11yHelper,
      isObject,
      outroAndDestroy }             from '@typhonjs-svelte/lib/util';

   import { TJSFocusWrap }          from '@typhonjs-fvtt/svelte/component/core';

   export let menu = void 0;

   export let id = '';

   export let x = 0;

   export let y = 0;

   export let items = [];

   export let zIndex = Number.MAX_SAFE_INTEGER - 100;

   /** @type {Record<string, string>} */
   export let styles = void 0;

   /** @type {string} */
   export let keyCode = void 0;

   export let focusSource = void 0;

   /** @type {{ duration: number, easing: Function }} */
   export let transitionOptions = void 0;

   $: styles = isObject(menu) && isObject(menu.styles) ? menu.styles :
    isObject(styles) ? styles : void 0;

   $: keyCode = isObject(menu) && typeof menu.keyCode === 'string' ? menu.keyCode :
    typeof keyCode === 'string' ? keyCode : 'Enter';

   // Provides options to `A11yHelper.getFocusableElements` to ignore TJSFocusWrap by CSS class.
   const s_IGNORE_CLASSES = { ignoreClasses: ['tjs-focus-wrap'] };

   // Store this component reference.
   const local = current_component;

   // Dispatches `close` event.
   const dispatch = createEventDispatcher();

   // Bound to the nav element / menu.
   let menuEl;

   // Stores if this context menu is closed.
   let closed = false;

   // Stores if menu has keyboard focus; detected on mount, when tab navigation occurs, and used to set `keypress` for
   // close event.
   // let hasKeyboardFocus = false;

   // ----------------------------------------------------------------------------------------------------------------

   onMount(() =>
   {
      const keyboardFocus = focusSource?.source === 'keyboard';

      // If the focus options designate that the source of the context menu came from the keyboard then focus the first
      // menu item on mount.
      if (keyboardFocus)
      {
         const firstFocusEl = A11yHelper.getFirstFocusableElement(menuEl);
         if (firstFocusEl instanceof HTMLElement && !firstFocusEl.classList.contains('tjs-focus-wrap'))
         {
            firstFocusEl.focus();
         }
         else
         {
            // Silently focus the menu element so that keyboard handling functions.
            menuEl.focus();
         }
      }
      else
      {
         // Silently focus the menu element so that keyboard handling functions.
         menuEl.focus();
      }
   });

   // ----------------------------------------------------------------------------------------------------------------

   /**
    * Provides a custom animate callback allowing inspection of the element to change positioning styles based on the
    * height / width of the element and `document.body`. This allows the context menu to expand up when the menu
    * is outside the height bound of `document.body` and expand to the left if width is greater than `document.body`.
    *
    * @param {HTMLElement} node - nav element.
    *
    * @returns {object} Transition object.
    */
   function animate(node)
   {
      const expandUp = y + node.clientHeight > document.body.clientHeight
      const expandLeft = x + node.clientWidth > document.body.clientWidth

      node.style.top = expandUp ? null : `${y}px`;
      node.style.bottom = expandUp ? `${document.body.clientHeight - y}px` : null;

      node.style.left = expandLeft ? null : `${x}px`;
      node.style.right = expandLeft ? `${document.body.clientWidth - x}px` : null;

      return slideFade(node, transitionOptions);
   }

   /**
    * Invokes a function on click of a menu item then fires the `close` event and automatically runs the outro
    * transition and destroys the component.
    *
    * @param {object} item - Function to invoke on click.
    */
   function onClick(item)
   {
      const callback = item?.onPress;

      if (typeof callback === 'function')
      {
         callback(item, { focusSource });
      }
      else
      {
         A11yHelper.applyFocusSource(focusSource)
         focusSource = void 0;
      }

      if (!closed)
      {
         dispatch('close');
         closed = true;
         outroAndDestroy(local);
      }
   }

   /**
    * Determines if a pointer pressed to the document body closes the context menu. If the click occurs outside the
    * context menu then fire the `close` event and run the outro transition then destroy the component.
    *
    * @param {PointerEvent|MouseEvent}  event - Pointer or mouse event from document body click / scroll wheel.
    *
    * @param {boolean}                  [isWheel=false] - True when scroll wheel; do not perform 2nd early out test.
    */
   function onClose(event, isWheel = false)
   {
      // Early out if the pointer down is inside the menu element.
      if (event.target === menuEl || menuEl.contains(event.target)) { return; }

      // Early out if the event page X / Y is the same as this context menu.
      if (!isWheel && Math.floor(event.pageX) === x && Math.floor(event.pageY) === y) { return; }

      if (!closed)
      {
         dispatch('close');
         closed = true;
         outroAndDestroy(local);
      }
   }

   /**
    * Handle key commands for closing the menu ('Esc') and reverse focus cycling via 'Shift-Tab'. Also stop propagation
    * for the key code assigned for menu item selection ('Enter').
    *
    * @param {KeyboardEvent}  event - KeyboardEvent.
    */
   function onKeydownMenu(event)
   {
      // Handle menu item keyCode selection.
      if (event.code === keyCode)
      {
         event.stopPropagation();
         return;
      }

      switch (event.code)
      {
         case 'Tab':
            event.stopPropagation();

            // Handle reverse focus cycling with `<Shift-Tab>`.
            if (event.shiftKey)
            {
               // Collect all focusable elements from `elementRoot` and ignore TJSFocusWrap.
               const allFocusable = A11yHelper.getFocusableElements(menuEl, s_IGNORE_CLASSES);

               // Find first and last focusable elements.
               const firstFocusEl = allFocusable.length > 0 ? allFocusable[0] : void 0;
               const lastFocusEl = allFocusable.length > 0 ? allFocusable[allFocusable.length - 1] : void 0;

               // Only cycle focus to the last keyboard focusable app element if `elementRoot` or first focusable
               // element is the active element.
               if (menuEl === document.activeElement || firstFocusEl === document.activeElement)
               {
                  if (lastFocusEl instanceof HTMLElement && firstFocusEl !== lastFocusEl) { lastFocusEl.focus(); }

                  event.preventDefault();
               }
            }

            break;

         default:
            // Any other key stop propagation preventing any global key handlers from responding.
            event.stopPropagation();
            break;
      }
   }

   /**
    * Handle key commands for closing the menu ('Esc') and reverse focus cycling via 'Shift-Tab'. Also stop propagation
    * for the key code assigned for menu item selection ('Enter').
    *
    * @param {KeyboardEvent}  event - KeyboardEvent.
    */
   function onKeyupMenu(event)
   {
      switch (event.code)
      {
         case 'ContextMenu':
         case 'Escape':
            event.preventDefault();
            event.stopPropagation();

            if (!closed)
            {
               closed = true;
               dispatch('close');
               outroAndDestroy(local);

               A11yHelper.applyFocusSource(focusSource)
               focusSource = void 0;
            }
            break;
      }
   }

   /**
    * Handle key presses on menu items.
    *
    * @param {KeyboardEvent}     event - KeyboardEvent.
    *
    * @param {TJSMenuItemData}   item - Menu item data.
    */
   function onKeyupItem(event, item)
   {
      if (event.code === keyCode)
      {
         if (!closed)
         {
            closed = true;
            dispatch('close');
            outroAndDestroy(local);

            event.preventDefault();
            event.stopPropagation();
         }

         const callback = item?.onPress;
         if (typeof callback === 'function')
         {
            callback(item, { focusSource });
         }
         else
         {
            A11yHelper.applyFocusSource(focusSource)
            focusSource = void 0;
         }
      }
   }

   /**
    * Closes context menu when browser window is blurred.
    */
   function onWindowBlur()
   {
      if (!closed)
      {
         dispatch('close');
         closed = true;
         outroAndDestroy(local);

         A11yHelper.applyFocusSource(focusSource)
         focusSource = void 0;
      }
   }
</script>

<!-- bind to `document.body` to receive pointer down & scroll wheel events to close the context menu. -->
<svelte:body on:pointerdown={onClose} on:wheel={(event) => onClose(event, true)}/>

<!-- bind to 'window' to close context menu when browser window is blurred. -->
<svelte:window on:blur={onWindowBlur}/>

<nav id={id}
     class=tjs-context-menu
     bind:this={menuEl}
     on:click|preventDefault|stopPropagation={() => null}
     on:keydown|stopPropagation={onKeydownMenu}
     on:keyup|preventDefault|stopPropagation={onKeyupMenu}
     style:z-index={zIndex}
     transition:animate
     use:applyStyles={styles}
     tabindex=-1>

    <ol class=tjs-context-menu-items>
        {#each items as item}
            {#if item['#type'] === 'class'}
                <li class=tjs-context-menu-item
                    on:click={() => onClick(item)}
                    on:keyup={(event) => onKeyupItem(event, item)}
                    role=menuitem
                    tabindex=0>
                    <span class=tjs-context-menu-focus-indicator />
                    <svelte:component this={item.class} {...(isObject(item.props) ? item.props : {})} />
                </li>
            {:else if item['#type'] === 'icon'}
                <li class="tjs-context-menu-item tjs-context-menu-item-button"
                    on:click={() => onClick(item)}
                    on:keyup={(event) => onKeyupItem(event, item)}
                    role=menuitem
                    tabindex=0>
                    <span class=tjs-context-menu-focus-indicator />
                    <i class={item.icon}></i>
                    <span class=tjs-context-menu-item-label>{localize(item.label)}</span>
                </li>
            {:else if item['#type'] === 'image'}
                <li class="tjs-context-menu-item tjs-context-menu-item-button"
                    on:click={() => onClick(item)}
                    on:keyup={(event) => onKeyupItem(event, item)}
                    role=menuitem
                    tabindex=0>
                    <span class=tjs-context-menu-focus-indicator />
                    <img src={item.image} alt={item.imageAlt}>
                    <span class=tjs-context-menu-item-label>{localize(item.label)}</span>
                </li>
            {:else if item['#type'] === 'separator-hr'}
                <hr>
            {/if}
        {/each}
    </ol>
    <TJSFocusWrap elementRoot={menuEl} />
</nav>

<style>
    .tjs-context-menu {
        position: fixed;
        width: fit-content;
        height: max-content;
        overflow: hidden;

        background: var(--tjs-context-menu-background, var(--tjs-default-menu-background, #23221d));
        border: var(--tjs-context-menu-border, var(--tjs-default-menu-border, 1px solid #000));
        border-radius: var(--tjs-context-menu-border-radius, var(--tjs-default-menu-border-radius, 5px));
        box-shadow: var(--tjs-context-menu-box-shadow, var(--tjs-default-popover-box-shadow, 0 0 10px #000));
        color: var(--tjs-context-menu-color, var(--tjs-default-menu-color, #eee));
        max-width: var(--tjs-context-menu-max-width, var(--tjs-default-menu-max-width, 360px));
        min-width: var(--tjs-context-menu-min-width, var(--tjs-default-menu-min-width, 20px));

        text-align: start;
    }

    .tjs-context-menu:focus-visible {
        outline: 2px solid transparent;
    }

    .tjs-context-menu-items {
        list-style: none;
        margin: 0;
        padding: 0;
    }

    .tjs-context-menu-items hr {
        margin-block-start: 0;
        margin-block-end: 0;
        margin: var(--tjs-context-menu-hr-margin, var(--tjs-default-hr-margin, 0 0.25em));
        border-top: var(--tjs-context-menu-hr-border-top, var(--tjs-default-hr-border-top, 1px solid #555));
        border-bottom: var(--tjs-context-menu-hr-border-bottom, var(--tjs-default-hr-border-bottom, 1px solid #444));
    }

    .tjs-context-menu-item {
        display: flex;
        align-items: center;
        line-height: var(--tjs-context-menu-item-line-height, var(--tjs-default-menu-item-line-height, 2em));
        padding: var(--tjs-context-menu-item-padding, var(--tjs-default-menu-item-padding, 0 0.5em 0 0));
    }

    /* Disable default outline for focus visible / within */
    .tjs-context-menu-item:focus-within, .tjs-context-menu-item:focus-visible {
        outline: none;
    }

    .tjs-context-menu-item i {
        text-align: center;
        width: var(--tjs-context-menu-item-icon-width, var(--tjs-default-menu-item-icon-width, 1.25em));
    }

    .tjs-context-menu-item img {
        width: var(--tjs-context-menu-item-image-width, var(--tjs-default-menu-item-image-width, 1.25em));
        height: var(--tjs-context-menu-item-image-height, var(--tjs-default-menu-item-image-height, 1.25em));
    }

    .tjs-context-menu-item-button {
        gap: var(--tjs-context-menu-item-button-gap, var(--tjs-default-menu-item-button-gap, 0.25em));
    }

    .tjs-context-menu-item-button:hover {
        color: var(--tjs-context-menu-item-color-focus-hover, var(--tjs-default-color-focus-hover, #fff));
        text-shadow: var(--tjs-context-menu-item-text-shadow-focus-hover, var(--tjs-default-text-shadow-focus-hover, 0 0 8px red));
    }

    .tjs-context-menu-item-button:focus-visible {
        color: var(--tjs-context-menu-item-color-focus-hover, var(--tjs-default-color-focus-hover, #fff));
        text-shadow: var(--tjs-context-menu-item-text-shadow-focus-hover, var(--tjs-default-text-shadow-focus-hover, 0 0 8px red));
    }

    .tjs-context-menu-focus-indicator {
        align-self: var(--tjs-context-menu-focus-indicator-align-self, var(--tjs-default-focus-indicator-align-self, stretch));
        border: var(--tjs-context-menu-focus-indicator-border, var(--tjs-default-focus-indicator-border));
        border-radius: var(--tjs-context-menu-focus-indicator-border-radius, var(--tjs-default-focus-indicator-border-radius, 0.1em));
        height: var(--tjs-context-menu-focus-indicator-height, var(--tjs-default-focus-indicator-height));
        width: var(--tjs-context-menu-focus-indicator-width, var(--tjs-default-focus-indicator-width, 0.25em));
    }

    .tjs-context-menu-item:focus-visible .tjs-context-menu-focus-indicator {
        background: var(--tjs-context-menu-focus-indicator-background, var(--tjs-default-focus-indicator-background, white));
    }

    /* Enable focus indicator for focus-within */
    /* Note: the use of `has` pseudo-selector that requires a child with :focus-visible */
    .tjs-context-menu-item:focus-within:has(:focus-visible) .tjs-context-menu-focus-indicator {
        background: var(--tjs-context-menu-focus-indicator-background, var(--tjs-default-focus-indicator-background, white));
    }

    /* Fallback for browsers that don't support 'has'; any user interaction including mouse will trigger */
    @supports not (selector(:has(*))) {
        .tjs-context-menu-item:focus-within .tjs-context-menu-focus-indicator {
            background: var(--tjs-context-menu-focus-indicator-background, var(--tjs-default-focus-indicator-background, white));
        }
    }

    .tjs-context-menu-item-label {
        overflow: var(--tjs-context-menu-item-label-overflow, var(--tjs-default-menu-item-label-overflow, hidden));
        text-overflow: var(--tjs-context-menu-item-label-text-overflow, var(--tjs-default-menu-item-label-text-overflow, ellipsis));
        white-space: var(--tjs-context-menu-item-label-white-space, var(--tjs-default-menu-item-label-white-space));
    }
</style>