# The machine's sounds

Each sound of the loom (`js/app/sound.js`) was edited for this project in Audacity from a sound
effect on Pixabay, under the [Pixabay Content License](https://pixabay.com/service/license-summary/)
(`LICENSES/LicenseRef-Pixabay.txt`). The licence allows free use and modification without
attribution; it does not allow the sounds to be sold or distributed on their own, apart from the
simulator.

| File | Plays at | Edited from |
|---|---|---|
| `press.mp3` | Next card pressed | [Clack](https://pixabay.com/sound-effects/film-special-effects-clack-92130/) |
| `lift.mp3` | Hooks taken (the griffe rises) | [Clank 1](https://pixabay.com/sound-effects/film-special-effects-clank1-91862/) |
| `turn.mp3` | Shed open (the cylinder turns) | [Suitcase click open, squeak](https://pixabay.com/sound-effects/film-special-effects-suitcase-click-open-sqeeeek-80500/) |
| `shuttle.mp3` | Shuttle across | [Swish sound](https://pixabay.com/sound-effects/film-special-effects-swish-sound-94707/) |
| `beat.mp3` | Beaten up | [Chopping wood](https://pixabay.com/sound-effects/film-special-effects-chopping-wood-96709/) |
| `fall.mp3` | Shed closed (the griffe falls) | [Mechanical 1](https://pixabay.com/sound-effects/film-special-effects-mechanical1-107614/) |
| `refuse.mp3` | The loom refuses | [Wood hit](https://pixabay.com/sound-effects/film-special-effects-wood-hit-432148/) |

A file replaced keeps its name; the app skips any silence at a file's start (`onset` in
`js/app/sound.js`), so each sound is heard on its moment.
