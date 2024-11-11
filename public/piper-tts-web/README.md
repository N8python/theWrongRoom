> This is a fork of [@diffusion-studio/vits-web](https://github.com/diffusion-studio/vits-web) for use
> of PiperTTS modules inside of a browser/Electron for AnythingLLM.
> A big shout-out goes to [Rhasspy Piper](https://github.com/rhasspy/piper), who open-sourced all the currently available models > (MIT License) and to [@jozefchutka](https://github.com/jozefchutka) who came up with the wasm build steps.

# Run PiperTTS based text-to-speech in the browser powered by the [ONNX Runtime](https://onnxruntime.ai/)

## Difference from the original

### Caching for client

You can leverage `TTSSessions` for a faster inference. (see index.js for implementation)
Credit to [this PR](https://github.com/diffusion-studio/vits-web/pull/5) for the starting point.

### Local WASM/Loading

You can define local WASM paths for the `ort` wasm as well as the phenomizer wasm and data file for faster local loading
since the client could be offline.

### Note:

This is a frontend library and will not work with NodeJS.

## Usage
First of all, you need to install the library:
```bash
yarn add @mintplex-labs/piper-tts-web
```

Then you're able to import the library like this (ES only)
```typescript
import * as tts from '@mintplex-labs/piper-tts-web';
```

Now you can start synthesizing speech!
```typescript
const wav = await tts.predict({
  text: "Text to speech in the browser is amazing!",
  voiceId: 'en_US-hfc_female-medium',
});

const audio = new Audio();
audio.src = URL.createObjectURL(wav);
audio.play();

// as seen in /example with Web Worker
```


With the initial run of the predict function you will download the model which will then be stored in your [Origin private file system](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system). You can also do this manually in advance *(recommended)*, as follows:
```typescript
await tts.download('en_US-hfc_female-medium', (progress) => {
  console.log(`Downloading ${progress.url} - ${Math.round(progress.loaded * 100 / progress.total)}%`);
});
```

The predict function also accepts a download progress callback as the second argument (`tts.predict(..., console.log)`). <br>

If you want to know which models have already been stored, do the following
```typescript
console.log(await tts.stored());

// will log ['en_US-hfc_female-medium']
```

You can remove models from opfs by calling
```typescript
await tts.remove('en_US-hfc_female-medium');

// alternatively delete all

await tts.flush();
```

And last but not least use this snippet if you would like to retrieve all available voices:
```typescript
console.log(await tts.voices());

// Hint: the key can be used as voiceId
```

### **That's it!** Happy coding :)
