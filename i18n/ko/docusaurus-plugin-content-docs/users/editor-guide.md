---
## sidebar_position: 2
---

# Editor

URLATE includes a built-in editor that lets you create and modify patterns.  
This guide will walk you through how to use it.  
It may seem a bit complicated at first, but if you follow the instructions step by step, you'll get the hang of it.  
If you have any questions, feel free to open an [issue](https://github.com/HyeokjinKang/URLATE-v3l-frontend/issues).

## Home Screen

When you first open the editor, you'll see the home screen.
![Home Screen](/img/editor/editor-home.webp)

1. **New**: Create a new pattern.
2. **Load**: Open an existing pattern file (.json).

### Creating a New Pattern

Click the `New` button to open the song selection screen.
Choose the song you want to use for your pattern.

![New Pattern](/img/editor/editor-select.webp)

1. Select a song from the list.
2. Click the `Select` button.

### Loading an Existing Pattern

Click the `Load` button to open the file selection dialog.
![Load Pattern](/img/editor/editor-load2.webp)

## Editor Screen

This is the main editor screen where you can create or modify patterns.  
It includes two toolbars, a timeline, a settings panel, and a preview area.

![Editor Screen](/img/editor/editor-main.webp)

1. **Essential Tools**

   - **Move**: Click and drag to move an object. You can also adjust its timing in the timeline.
   - **Edit**: Click to edit the selected object. The settings panel will update accordingly.
   - **Add**: Click to add a new object. The new object will be automatically selected.

2. **Test / Save**

   - **Test**: Redirects to the test page. The current pattern is saved in local storage, but it's recommended to export it as a file.
   - **Save**: Exports the pattern as a `.json` file.

3. **[Editor Tools](#editor-tools)**
4. **Playback Controls**

   - **Play**: Starts preview playback.
   - **Stop**: Stops playback.
   - **Rate**: Adjusts playback speed (default: `100%`).

5. **Time Indicator**: Displays the current preview time. Click to copy it to clipboard.
6. **Elements Viewer**: Shows stacked objects if multiple exist at the same time.
7. **Timeline**: Displays added objects. Drag to change their timing.
8. **Beat Selector**: Click to choose how beats are divided.
9. **Key Indicator**: Displays currently pressed keys (`Shift`, `Ctrl`, `⌘`).
10. **Zoom**: Zooms in or out of the timeline.
11. **Settings Panel**: Toggles the settings panel.
12. **[Element Tools](#element-tools)**
13. **Move (Time)**: Move the timeline by specifying a time value.

### Pattern Settings

Click the `Settings` button with no object selected to open global pattern settings.
![Pattern Settings](/img/editor/editor-settings.webp)

- **INFORMATION**: Basic pattern metadata. If it's a collaborative work, update the `AUTHOR` field.
- **PROPERTY**

  - **BPM**: Sets the initial beats per minute.
  - **SPEED**: Controls how fast objects move (range: `1`–`5`).
  - **SYNC**: Adjusts offset in milliseconds for audio syncing.

### Note Settings

Add notes using the `Add` tool and clicking the preview. Selecting a note updates the settings panel.

#### Click Note

![Note Settings](/img/editor/editor-note.webp)

#### Wheel Note

![Wheel Note Settings](/img/editor/editor-wheel.webp)

#### Hold Note

![Hold Note Settings](/img/editor/editor-hold.webp)

All notes share these settings:

- **POSITION**

  - **X / Y**: Note position (range: `-100` to `100`).

- **PROPERTY**

  - **TIMING**: Beat count from the start of the song.
  - **DIRECTION** (Wheel note): Either `-1` or `1`.
  - **TIME** (Hold note): Beat duration from note start.

- **ACTION**

  - **CHANGE**: Change note type.
  - **DELETE**: Remove the note.

### Bullet Settings

Add bullets using the `Add` tool by clicking the side of the preview. Select or add a bullet to see its settings.

#### Pointed Bullet

![Pointed Bullet Settings](/img/editor/editor-bullet.webp)

- **POSITION**

  - **SIDE**: Which side the bullet appears from.
  - **LOCATION**: Position along that side (0–100).

- **PROPERTY**

  - **TIMING**: Beat count from the start of the song.
  - **SPEED**: Bullet speed.

- **ACTION**

  - **CHANGE**: Change bullet type.
  - **DELETE**: Delete the bullet.

### Trigger Settings

Add triggers by clicking the outer area of the preview using the `Add` tool. Each trigger type can be selected after creation.

![Trigger Settings](/img/editor/editor-trigger-add.webp)

#### Destroy Trigger

Destroys a specific bullet.  
You should set the `TARGET NUM` value to determine which bullet will be destroyed.
![Destroy Trigger Settings](/img/editor/editor-trigger-destroy.webp)

1. This error message occurs because there is currently no `bullet_0` pointed to by `destroy trigger`.

#### Destroy All Trigger

Destroys all bullets.
![Destroy All Trigger Settings](/img/editor/editor-trigger-destroyall.webp)

#### BPM Trigger

Immediately changes the BPM.
![BPM Trigger Settings](/img/editor/editor-trigger-bpm.webp)

#### Speed Trigger

Immediately changes the speed.
![Speed Trigger Settings](/img/editor/editor-trigger-speed.webp)

#### Opacity Trigger

Sets canvas opacity (range: `0` to `1`).
![Opacity Trigger Settings](/img/editor/editor-trigger-opacity.webp)

#### Text Trigger

Displays text on the canvas.
![Text Trigger Settings](/img/editor/editor-trigger-text.webp)

1. This text is generated by the `text trigger`.

- **PROPERTY**

  - **TIMING**: Beat count from the start of the song.
  - **V-ALIGN / ALIGN**: Text alignment (see [MDN docs](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline)).
  - **WEIGHT / SIZE**: Font weight (10–900) and size (CSS unit, `vh` recommended).
  - **TIME**: Duration to display, in beats.

- **POSITION (X / Y)**: Text position (`-100` to `100`).
- **VALUE (TEXT)**: The actual text to display.

## Editor Tools

### Magnet

Snaps notes to the grid.
![Magnet](/img/editor/editor-tool-magnet.webp)

1. As you can see, the notes are ignored the grid when the magnet is disabled.

### Grid

Toggles grid visibility.  
Even if the grid is invisible, the notes will be snapped to the grid if the magnet is enabled.
![Grid](/img/editor/editor-tool-grid.webp)

### Metronome

Plays metronome sound during preview playback.
![Metronome](/img/editor/editor-tool-metronome.webp)

### Circle Grid

Displays a circular grid when notes are selected, useful for jump patterns.
![Circle Grid](/img/editor/editor-tool-circle.webp)

1. As you can see, the note is snapped to the circle grid.

## Element Tools

Copy/paste one or multiple objects using these buttons.
![Element Tools](/img/editor/editor-tool-element-tools.webp)

### Copy

Click or press `Ctrl(⌘) + C` to copy.
![Copy](/img/editor/editor-tool-copy.webp)

1. The alert will be shown when you copy the objects.

### Paste

Click or press `Ctrl(⌘) + V` to paste.
![Paste](/img/editor/editor-tool-paste.webp)

### Range Copy

Copy objects within a selected range.
![Range Copy](/img/editor/editor-tool-rangecopy.webp)

You will see the element selection dialog.

![Range Copy Dialog](/img/editor/editor-tool-rangecopy2.webp)

1. Select the element type you want to copy.
1. Press `OK` to copy the objects.

You can see the alert telling you to select the range.

![Range Copy Range](/img/editor/editor-tool-rangecopy3.webp)

Select the start element from the timeline or preview.

![Range Copy Range2](/img/editor/editor-tool-rangecopy4.webp)

Alert will be shown when you select the start element.  
Now select the end element.

![Range Copy Range3](/img/editor/editor-tool-rangecopy5.webp)

Alert will tell you the range you selected.

### Range Paste

Paste objects copied via range.
![Range Paste](/img/editor/editor-tool-rangepaste.webp)

1. Alert will be shown when you paste the objects.

## Shortcuts

Press `/(?)` or hover over the `Shortcuts` tool to view all shortcuts.
![Shortcuts](/img/editor/editor-shortcuts.webp)
