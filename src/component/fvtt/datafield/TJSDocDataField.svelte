<script>
   /**
    * @componentDocumentation
    */

   import {
      getContext,
      onDestroy }          from '#svelte';

   import { onMount }      from '#svelte';

   import { TJSDocument }  from '#runtime/svelte/store/fvtt/document';

   import {
      PropertyPathMap,
      safeAccess }         from '#runtime/util/object';

   import TJSDataField     from './TJSDataField.svelte';

   /**
    * @import { Unsubscriber }      from 'svelte/store';
    *
    * @import { MinimalWritable }   from '#runtime/svelte/store/util';
    * @import { PropertyPath }      from '#runtime/util/object';
    */

   /**
    * @type {TJSDocument | undefined}
    */
   export let doc = void 0;

   /**
    * Provides the default context key to search for a TJSDocument instance.
    *
    * @type {string}
    *
    * @defaultValue `'rootDocument'`
    */
   export let docContext = 'rootDocument';

   /**
    * Document property path with DataField defined to subscribe to.
    *
    * @type {PropertyPath}
    */
   export let path = void 0;

   /**
    * @type {PropertyPathMap<MinimalWritable>}
    */
   const propertyMap = new PropertyPathMap()

   /**
    * @type {TJSDocument | undefined}
    */
   let activeDoc;

   /**
    * @type {Unsubscriber}
    */
   let unsubscribe;

   /**
    * @type {fvtt.DataField | undefined}
    */
   let datafield;

   /**
    *
    */
   let store;

   onMount(() =>
   {
      propertyMap.set(path, store);
   });

   onDestroy(() =>
   {
      unsubscribe?.();
      unsubscribe = void 0;

      activeDoc = void 0;
   });

   $:
   {
      const contextDoc = getContext(docContext);

      const newDoc = doc instanceof TJSDocument ? doc :
       contextDoc instanceof TJSDocument ? contextDoc : void 0;

      if (newDoc !== activeDoc)
      {
         unsubscribe?.();
         unsubscribe = void 0;
      }

      activeDoc = newDoc;

      if (activeDoc) { unsubscribe = activeDoc.subscribe(docUpdate); }
   }

   /**
    * @param {fvtt.ClientDocument} [doc] - Underlying Foundry doc.
    *
    * @param {TJSDocument.Data.Update} [options] - Update options.
    */
   function docUpdate(doc, options)
   {
      console.log(`!!! TJSDocDataField - docUpdate - 0 - options: \n${JSON.stringify(options, null, 2)}`);
      console.log(`!!! TJSDocDataField - docUpdate - 1 - doc:`, doc);

      switch (options.action)
      {
         case 'delete':
            datafield = void 0;
            break;

         case 'tjs-set-new':
            datafield = doc?.getFieldForProperty(path);
            console.log(`!!! TJSDocDataField - docUpdate - action (tjs-set-new) - 0 - datafield:`, datafield);

            const prop = safeAccess(doc, path);

            // console.log(`!!! TJSDocDataField - docUpdate - action (tjs-set-new) - 1 - safeAccess(doc, '${path}'):`, prop);

            $store = prop
            break;

         case 'update':
         {
            const data = options.data?.[0];

            console.log(`!!! TJSDocDataField - docUpdate - action (update) - 0 - data:`, JSON.stringify(data));

            for (const [key, mapStore, value] of propertyMap.matchingEntries(data, { includePropertyValue: true }))
            {
               console.log(`!!! TJSDocDataField - docUpdate - action (update) - A1 - key:`, key);
               console.log(`!!! TJSDocDataField - docUpdate - action (update) - A2 - mapStore === store:`, mapStore === store);
               console.log(`!!! TJSDocDataField - docUpdate - action (update) - A3 - value:`, value);

               if (mapStore) { mapStore.set(value); }
            }

            // if (isObject(data) && data._stats && hasProperty(data, path))
            // {
            //    $store = safeAccess(data, path);
            // }

            break;
         }
      }
   }
</script>

<TJSDataField bind:store {datafield} />
