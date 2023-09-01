---
sidebar_position: 2
---

# Editor

URLATE has a built-in editor that allows you to create patterns.  
This guide will help you learn how to use the editor.  
It's a bit complicated, but if you follow the instructions carefully, you'll be able to use the editor nicely.  
If you have any questions, please feel free to open [Issues](https://github.com/HyeokjinKang/URLATE-v3l-frontend/issues).

## Home screen

When you first enter the editor, you will see the home screen.
![Home Screen](/img/editor-home.webp)

1. **New**: Create a new pattern.
2. **Load**: Open a pattern file(.json) that you have created before.

### Making a new pattern

If you click the `New` button, you will see the song selection screen.  
Select the song you want to make a pattern for.

![New Pattern](/img/editor-select.webp)

1. Select a song from the list.
2. Click the `Select` button to select the song.

### Loading a existing pattern

If you click the `Load` button, you will see the file selection dialog.

![Load Pattern](/img/editor-load2.webp)

## Editor screen

This is the editor screen.  
Here you can create a new pattern or load an existing pattern and modify it.  
The editor consists of two toolbars, a timeline, a settings panel, and a preview.

![Editor Screen](/img/editor-main.webp)

1. **Essential tools**
   - **Move**  
     Click and drag to move the selected object.  
     You can also change the timing of the object by dragging the object on the timeline.
   - **Edit**  
     Click to edit the selected object.  
     The settings panel will change and appear according to the object you selected.
   - **Add**  
     Click to add a new object.  
     Added object will be selected automatically.
2. **Test / Save**
   - **Test**  
     Clicking this button will redirect you to the test page.  
     The pattern you are currently editing will be saved in the browser's local storage, but it's recommended to save it as a file.
   - **Save**  
     Click to save the pattern.  
     The pattern will be saved as a file(.json).
3. **[Assist tools](#editor-tools)**
4. **Playback controls**
   - **Play**  
     Click to play the pattern.  
     The preview will start playing.
   - **Stop**  
     Click to stop the preview.
   - **Rate**  
     You can change the playback speed of the preview.  
     The default value is `100%`.
5. **Time indicator**  
   You can see the current time of the preview here.  
   Clicking this will copy the current time to the clipboard.
6. **Elements viewer**  
   If you stack multiple objects at the similar time, the line will be divided into multiple lines and you can see the objects stacked at the same time.
7. **Timeline**  
   You can see the objects you added here.  
   You can also change the timing of the object by dragging the object on the timeline.
8. **Beat selector**  
   You can determine how to divide the beats by clicking this.
9. **Key indicator**  
   This text shows the key you are currently pressing.  
   (`Shift`, `Ctrl`, `⌘`)
10. **Zoom**  
    You can zoom in or out the timeline by clicking this.
11. **Settings panel**  
    Clicking this will toggle the settings panel.
12. **[Element tools](#element-tools)**
13. **Move**  
    By clicking this, you can move the timeline by entering the time you want to move.

### Pattern settings

Open the settings panel by clicking the `Settings` button without selecting any object.
![Pattern Settings](/img/editor-settings.webp)

You can change the global pattern settings here.

- **INFORMATION**  
  Information you entered here will be saved in the pattern file.  
  If your pattern is the result from many people's collaboration, it's recommended to change `AUTHOR` field.
- **PROPERTY**  
  You can set the default value of the property here.
  - **TEMPO**  
    _This is deprecated field. It will be removed in the future._
  - **BPM**  
    This value will set the initial value of the `BPM`.
  - **SPEED**  
    `SPEED` determines how fast the objects move.  
    For example, if you increase the `SPEED` value, the notes will appear for a shorter time.  
    The value should be between `1` and `5`.
  - **SYNC**  
    If the song is off-beat, you can adjust the timing by changing this value.  
    This is the number of milliseconds to adjust the timing.
- **BACKGROUND**  
  URLATE supports using [lottie files](https://lottiefiles.com) as a background.

### Note settings

You can add notes with using the `Add` tool, by clicking the preview.  
If you select a note, the settings panel will change and appear according to the note you selected.

#### Click note

![Note Settings](/img/editor-note.webp)

#### Wheel note

![Wheel Note Settings](/img/editor-wheel.webp)

#### Hold note

![Hold Note Settings](/img/editor-hold.webp)

All notes have the following settings.

- **POSITION**
  - **X**  
    The X position of the note.  
    The value should be between `-100` and `100`.
  - **Y**  
    The Y position of the note.  
    The value should be between `-100` and `100`.
- **PROPERTY**
  - **TIMING**  
    The timing of the note.  
    The value means the millisecond from the start of the song.
  - **DIRECTION**(Wheel note)  
    The direction of the wheel note.  
    The value should be `-1` or `1`.
  - **TIME**(Hold note)  
    The time of the hold note.  
    The value means the millisecond from the start of the note.
- **ACTION**
  - **CHANGE**  
    You can change the type of the note by clicking this.
  - **DELETE**  
    You can delete the note by clicking this.

### Bullet settings

You can add bullets with using the `Add` tool, by clicking the side of the preview.  
If you select or add a bullet, the settings panel will change and appear according to the bullet you selected.

#### Pointed bulet

![Pointed Bullet Settings](/img/editor-bullet.webp)

#### Rounded bullet

![Rounded Bullet Settings](/img/editor-bullet2.webp)

All bullets have the following settings.

- **POSITION**
  - **SIDE**  
    This value determines which side the bullet will appear.
  - **LOCATION**  
    The location of the bullet.  
    The value should be between `0` and `100`.
  - **ANGLE**(Pointed bullet)  
    The degree angle of the bullet.  
    The value should be between `-180` and `180`.  
    The value can be more than `180` or less than `-180`, but it could be result in unexpected behavior.
- **PROPERTY**
  - **TIMING**  
    This value means the millisecond from the start of the song.
  - **SPEED**  
    This value determines how fast the bullet will move.  
    The value should be between `1` and `5`.
- **ACTION**
  - **CHANGE**  
    You can change the type of the bullet by clicking this.
  - **DELETE**  
    You can delete the bullet by clicking this.

### Trigger settings

You can add triggers with using the `Add` tool, by clicking the outside of the preview.  
If you select or add a trigger, the settings panel will change and appear according to the trigger you selected.

![Trigger Settings](/img/editor-trigger-add.webp)

If you add a trigger, there will be no type.  
You should select the type of the trigger by selecting the option in the settings panel.

![Trigger Default Settings](/img/editor-trigger-default.webp)

#### Destroy trigger

This trigger will destroy the bullet when it called.  
You should set the `TARGET NUM` value to determine which bullet will be destroyed.
![Destroy Trigger Settings](/img/editor-trigger-destroy.webp)

1. This error message occurs because there is currently no `bullet_0` pointed to by `destroy trigger`.

#### Destroy all trigger

This trigger will destroy all bullets when it called.
![Destroy All Trigger Settings](/img/editor-trigger-destroyall.webp)

#### BPM trigger

This trigger will change the `BPM` immediately when it called.
![BPM Trigger Settings](/img/editor-trigger-bpm.webp)

#### Speed trigger

This trigger will change the `SPEED` immediately when it called.
The value should be between `1` and `5`.
![Speed Trigger Settings](/img/editor-trigger-speed.webp)

#### Opacity trigger

This trigger will change the opacity of the canvas immediately when it called.  
The value should be between `0` and `1`.
![Opacity Trigger Settings](/img/editor-trigger-opacity.webp)

#### Text trigger

You can add text to the canvas with this trigger.  
![Text Trigger Settings](/img/editor-trigger-text.webp)

1. This text is generated by the `text trigger`.

- **PROPERTY**
  - **TIMING**  
    This value means the millisecond from the start of the song.
  - **V-ALIGN**  
    This value determines the vertical alignment of the text.  
    The value is equal to the `CanvasRenderingContext2D.textBaseline` property.  
    You can see the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textBaseline) for more information.
  - **ALIGN**  
    This value determines the horizontal alignment of the text.  
    The value is equal to the `CanvasRenderingContext2D.textAlign` property.  
    You can see the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/textAlign) for more information.
  - **WEIGHT**  
    This value determines the font weight of the text.  
    It should be between `10` and `900`.
  - **SIZE**
    This value determines the font size of the text.  
    Its unit can be any CSS unit, but it is recommended to use vh.
  - **TIME**  
    This value determines how long the text will be displayed.  
    The value means the millisecond from the start of the text.
- **POSITION**
  - **X**  
    The X position of the text.  
    The value should be between `-100` and `100`.
  - **Y**  
    The Y position of the text.  
    The value should be between `-100` and `100`.
- **VALUE**
  - **TEXT**  
    The text to be displayed.

## Editor tools

The editor has several tools to help you create patterns.

### Magnet

If you enable this tool, the notes will be snapped to the grid.

![Magnet](/img/editor-tool-magnet.webp)

1. As you can see, the notes are ignored the grid when the magnet is disabled.

### Grid

You can change the visibility of the grid by clicking this.  
Even if the grid is invisible, the notes will be snapped to the grid if the magnet is enabled.

![Grid](/img/editor-tool-grid.webp)

### Metronome

If you enable this tool, the metronome will be played when the preview is playing.

![Metronome](/img/editor-tool-metronome.webp)

### Circle grid

If you enable this tool, the circle grid will be displayed when the notes are selected.  
Notes will be snapped to the circle grid.  
This tool is useful when you want to create a `jump pattern`.

![Circle Grid](/img/editor-tool-circle.webp)

1. As you can see, the note is snapped to the circle grid.

## Element tools

You can copy and paste multiple objects or one object by using these buttons.

![Element Tools](/img/editor-tool-element-tools.webp)

### Copy

You can copy the selected objects by clicking this.

:::tip

You can also copy the selected objects by pressing `Ctrl(⌘) + C`.

:::

![Copy](/img/editor-tool-copy.webp)

1. The alert will be shown when you copy the objects.

### Paste

You can paste the copied objects by clicking this.

:::tip

You can also paste the copied objects by pressing `Ctrl(⌘) + V`.

:::

![Paste](/img/editor-tool-paste.webp)

### Range copy

You can copy the objects in the range by clicking this.

![Range Copy](/img/editor-tool-rangecopy.webp)

You will see the element selection dialog.

![Range Copy Dialog](/img/editor-tool-rangecopy2.webp)

1. Select the element type you want to copy.
1. Press `OK` to copy the objects.

You can see the alert telling you to select the range.

![Range Copy Range](/img/editor-tool-rangecopy3.webp)

Select the start element from the timeline or preview.

![Range Copy Range2](/img/editor-tool-rangecopy4.webp)

Alert will be shown when you select the start element.  
Now select the end element.

![Range Copy Range3](/img/editor-tool-rangecopy5.webp)

Alert will tell you the range you selected.

### Range Paste

You can paste the copied objects in the range by clicking this.

![Range Paste](/img/editor-tool-rangepaste.webp)

1. Alert will be shown when you paste the objects.

## Editor shortcuts

You can see the editor shortcuts by pressing `/(?)` or hovering the `Shortcuts` tool.

![Editor Shortcuts](/img/editor-shortcuts.webp)
