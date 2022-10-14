<script>
   import { applyStyles }   from '@typhonjs-svelte/lib/action';

   import { TJSSvgFolder }  from '../folder/index.js';

   import SettingEntry      from './SettingEntry.svelte';

   import { TJSSettingsEditImpl } from './TJSSettingsEditImpl.js';

   export let settings = void 0;
   export let styles = void 0;

   console.log(`! settings: `, settings);

   const parsedSettings = TJSSettingsEditImpl.parseSettings(settings);

   console.log(`! parsedSettings: `, parsedSettings);
</script>

<main>
   <div class=scrollable>
      <div class=content use:applyStyles={styles}>
         <section>
            {#each parsedSettings.topLevel as setting (setting.key)}
               <SettingEntry {setting} />
            {/each}
         </section>
         {#each parsedSettings.folders as folder}
         <section>
            <TJSSvgFolder label={folder.name}>
               {#each folder.settings as setting (setting.key)}
                  <SettingEntry {setting} />
               {/each}
            </TJSSvgFolder>
         </section>
         {/each}
      </div>
   </div>
</main>

<style>
   main {
      display: flex;
      flex-direction: column;
      height: 100%;
   }

   .scrollable {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;
      flex-wrap: nowrap;
      overflow: hidden auto;
      padding-bottom: 0.5em;
   }

   section {
      background: rgba(199, 199, 199, 0.85);
      border: 2px solid rgba(0, 0, 0, 0.75);
      border-radius: 0.75em;
      padding: 0.5em;
   }

   section:not(:last-child) {
      margin-bottom: 0.75em;
   }
</style>