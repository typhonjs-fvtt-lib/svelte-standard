import { AlphaState }      from './AlphaState.js';
import { HexState }        from './HexState.js';
import { HslState }        from './HslState.js';
import { HsvState }        from './HsvState.js';
import { RgbState }        from './RgbState.js';

/**
 * Manages the text state for all supported color formats such as `rgb` and `hex` formats. The internal storage format
 * is HSV and the conversions between floating point and integer representation in the text input GUI is lossy.
 * TextState provides a store that tracks the text representations like `rgb` component values (0 - 255). Changes from
 * the text input component are converted into internal HSV representation and set the `hue` and `sv` stores setting
 * the #interalUpdate `textUpdate` flag so that {@link ColorState.#updateCurrentColor} doesn't update TextState. This
 * makes it possible to support a single internal color representation in HSV and not have independent variables for
 * each type.
 */
export class TextState
{
   /**
    * @type {{ alpha: AlphaState, hex: HexState, hsl: HslState, hsv: HsvState, rgb: RgbState }}
    */
   #allState;

   /**
    * Stores the subscribers.
    *
    * @type {(function(TextState): void)[]}
    */
   #subscriptions = [];

   /**
    * @param {ColorState}                 colorState - ColorState instance.
    *
    * @param {ColorStateInternalUpdate}   internalUpdate - ColorState internal store update data.
    */
   constructor(colorState, internalUpdate)
   {
      /** @type {ColorStateAccess} */
      const colorStateAccess = {
         stores: colorState.stores,
         internalUpdate
      }

      /** @type {TextStateAccess} */
      const textStateAccess = {
         updateColorInternal: this.#updateColorInternal.bind(this)
      }

      this.#allState = {
         alpha: new AlphaState(colorStateAccess, textStateAccess),
         hex: new HexState(colorStateAccess, textStateAccess),
         hsl: new HslState(colorStateAccess, textStateAccess),
         hsv: new HsvState(colorStateAccess, textStateAccess),
         rgb: new RgbState(colorStateAccess, textStateAccess)
      }
   }

   /**
    * @returns {AlphaState}
    */
   get alpha()
   {
      return this.#allState.alpha;
   }

   /**
    * @returns {HexState}
    */
   get hex()
   {
      return this.#allState.hex;
   }

   /**
    * @returns {HslState}
    */
   get hsl()
   {
      return this.#allState.hsl;
   }

   /**
    * @returns {HsvState}
    */
   get hsv()
   {
      return this.#allState.hsv;
   }

   /**
    * @returns {RgbState}
    */
   get rgb()
   {
      return this.#allState.rgb;
   }

   /**
    * @param {boolean}  canChangeMode - New can change mode state.
    */
   set canChangeMode(canChangeMode)
   {
      this.#canChangeModes = canChangeMode;
   }

   /**
    * Updates all text state for supported formats from the given color.
    *
    * @param {{h: number, s: number, v: number}}  color - A supported ColorD color format.
    */
   updateColor(color)
   {
      this.#allState.alpha._updateColor(color);
      this.#allState.hex._updateColor(color);
      this.#allState.hsl._updateColor(color);
      this.#allState.hsv._updateColor(color);
      this.#allState.rgb._updateColor(color);

      this.#updateSubscribers();
   }

   /**
    * Provides a mechanism for the various color modes to update the other modes on changes to internal state.
    *
    * @param {object}   color - Color object from the source mode.
    *
    * @param {string}   skipMode - Mode index to skip; IE when invoked from a given mode that mode is skipped.
    */
   #updateColorInternal(color, skipMode)
   {
      for (const key in this.#allState)
      {
         if (key === skipMode) { continue; }

         this.#allState[key]._updateColor(color);
      }

      this.#updateSubscribers();
   }

   // Store subscriber implementation --------------------------------------------------------------------------------

   /**
    * @param {function(TextState): void} handler - Callback function that is invoked on update / changes.
    *
    * @returns {(function(): void)} Unsubscribe function.
    */
   subscribe(handler)
   {
      this.#subscriptions.push(handler); // add handler to the array of subscribers

      handler(this);                     // call handler with current value

      // Return unsubscribe function.
      return () =>
      {
         const index = this.#subscriptions.findIndex((sub) => sub === handler);
         if (index >= 0) { this.#subscriptions.splice(index, 1); }
      };
   }

   /**
    * Updates subscribers.
    */
   #updateSubscribers()
   {
      for (let cntr = 0; cntr < this.#subscriptions.length; cntr++) { this.#subscriptions[cntr](this); }
   }
}

/**
 * @typedef {object} ColorStateAccess
 *
 * @property {ColorStateStores} stores - The stores from {@link ColorState}.
 *
 * @property {ColorStateInternalUpdate} internalUpdate - The internal tracking state from {@link ColorState}.
 */

/**
 * @typedef {object} TextStateAccess
 *
 * @property {Function} updateColorInternal - Provides access to the #updateColorInternal method.
 */

/**
 * @typedef {object} TextStateStores
 *
 * @property {import('svelte/store').Readable<object>} activeMode - The current active text mode config object.
 */
