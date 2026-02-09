# Scene Swapper

## Introduction / Summary

Scene Swapper is an on-canvas application allowing users to swap scenes by clicking on the key asset.

## Key Features

### Canvas elements & interactions

- Key Asset: When clicked this asset will automatically swap the current scene for another one.

### Data objects

- Key Asset: the data object attached to the dropped key asset stores the default and currently displayed scene.

## Developers

### Built With

#### Server

![Node.js](https://img.shields.io/badge/node.js-%2343853D.svg?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-%23000000.svg?style=for-the-badge&logo=express&logoColor=white)

### Add your .env environmental variables

```json
API_KEY=xxxxxxxxxxxxx
INSTANCE_DOMAIN=api.topia.io
INSTANCE_PROTOCOL=https
INTERACTIVE_KEY=xxxxxxxxxxxxx
INTERACTIVE_SECRET=xxxxxxxxxxxxxx
SCENE_IDS=xxxxxxxxxxxxxx,xxxxxxxxxxxxxx,xxxxxxxxxxxxxx
```

### Where to find API_KEY, INTERACTIVE_KEY and INTERACTIVE_SECRET

[Topia Dev Account Dashboard](https://dev.topia.io/t/dashboard/integrations)

[Topia Production Account Dashboard](https://topia.io/t/dashboard/integrations)

### Implementation Requirements

The `SCENE_IDS` environment variable should contain a comma-separated list of scene IDs that the asset will cycle through when clicked.

### Helpful links

- [SDK Developer docs](https://metaversecloud-com.github.io/mc-sdk-js/index.html)
