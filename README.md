<div align="center">
    <img alt="Pino Global Webhook" title="Logo" src="./github/logo.png" width="200px" height="200" />
</div>
# Pino Global Webhook

If have a webhook then i will send

# Use

```typescript
const url = 'MyWebHook Url';
import { createTransport } from "pino-global-webhook";
const logger = pino(
  createTransport({
    webhooks: [
      url
    ],
  })
);
logger.info("hello world");
logger.warn("hello world");
```
#Configs
``` javascript
createTransport({
    webhooks: [], //urls
    discord:{
        webhookType: 1, //1| 2| 3 Discord webhook types
        colors:{ //Hexadecimal colors and default colors 
          TRACE: 0x808080, 
          DEBUG: 0x008000,
          INFO: 0x00bfff,
          WARN: 0xffa500,
          ERROR: 0xff4500,
          FATAL: 0xff0000,
          OTHERS: 0x440f3c,
        },
        sameAgent: true, // if you will use a new agent in every webhook
        removeTag:["level"], // Remove a tag from the log
        withWordRemoveTag : "coffe" ,// When find the word will delete the tag
        customTags: [{"mateus":"hello"}] // Add your custom tags from the log :D
    },
    slack:{/* same at discord without "colors" and "webhooktype" */},
    others:{/* same at discord without "colors" and "webhooktype" */},
  })

```



#Test
|Webhook|Status|
| --- | :---: |
|Discord| ✅| 
|Slack| 🚧| 
|Others| 🚧|
