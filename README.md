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
#todo