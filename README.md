# Pixl
Pixl is a minimalist pixel art editor with

**Live preview:** https://pixlart.netlify.app/

<img
 src="https://github.com/user-attachments/assets/0b18b11c-9a3f-434b-8667-9767d72010f1"
 width=400>
<img 
 src="https://github.com/user-attachments/assets/90a38e3a-56fc-4a0e-aeb4-9ee59cdca991"
 width=400>
<img
 src="https://github.com/user-attachments/assets/3fe99a03-13de-4670-9005-42d15e3d4ee5"
 width=200>


## How It's Made:

**Tech used:** \
TypeScript, \
React, \
TailwindCss,\
[modern-gif] for gif encoding and decoding

This project was my first time working with the HTML ```<canvas>``` API. To manage everything, I built a single React context that exposes multiple systems through organized "controllers" and custom hooks.

Canvas-related logic is divided into two main custom hooks: one for tools, and one for frame and animation management.
The tools hook is state-driven and handles things like selected tool, brush width, color palette, and active color pair (used for quick color swapping).
The frame hook takes care of the offscreen buffer canvas, animation handling, import/export logic, and the undo metastack (a sort of stack of stacks that keeps a separate undo stack for each animation frame).

Rather than drawing directly to the visible canvas, all edits are made to an offscreen buffer canvas. This buffer is then scaled and rendered onto the visible canvas, giving me more control over how rendering works and enabling visual features like onion skinning and overlays.

All control logic is in a single React context that provides access to three main controllers:

Tools controller – manages tool selection, colors, and brush behavior

Canvas controller – handles actual canvas rendering logic, onion skin layers, transparency grid, and hover overlays

Viewport controller – manages resolution, canvas dimensions, and camera behavior

The visible canvas supports a basic camera system, allowing users to zoom in/out and pan around the drawing area. This makes detailed editing easier and improves usability on both desktop and mobile layouts.

## Optimizations

Efficient undo stack \
Each frame has its own undo stack, but instead of saving full image states, only the RGBA deltas and coordinates of changed pixels are stored. This keeps memory usage reasonable and makes undo/redo fast by simply applying or reverting the pixel differences.


Asynchronous frame encoding \
Animation frames are converted to base64-encoded PNGs for export and playback. Since this encoding process is asynchronous, an empty string is first inserted into the frame list and replaced by the encoded image. This avoids race conditions that could otherwise lead to frames being added in the wrong order.


Line drawing with Bresenham's line algorithm \
Each stroke is interpolated using Bresenham’s line algorithm to prevent gaps on fast cursor movements.


Offscreen Buffer for Scaled Rendering \
All drawing is first done on an offscreen buffer canvas, which is then rendered (scaled) onto the main visible canvas to preserve pixel-perfect accuracy, even at arbitrary scale and zoom, by avoiding js floating point hell.


Refs & Class-Based Logic for Performance \
Most of the app relies on refs and class instances instead of React state to avoid unnecessary rerenders. I use this approach for performance-critical logic like canvas drawing, input handling, and animations.


## Lessons Learned:

Mostly working with the Canvas API. I had to implement my own solution for drawing empty rectangles, since stroke-based drawing is anti-aliased and ends up creating translucent 2px-wide walls instead of solid 1px lines. I ran into architectural issues a few times and had to refactor a lot of my logic to make things more modular — like rewriting the tools logic into an “actions” system that calls the selected tool, instead of calling tools directly and repeating the same boilerplate like getting pointer coordinates.

The biggest source of frustration was the camera system, mostly because of floating point precision, or the lack of it. I always try to keep architecture in mind from the start, but this project really made me realize that it would’ve been better to plan things out a bit more — even just making a list of features, ideas for how to implement them, or some rough requirements would’ve helped avoid coding myself into a corner.


[modern-gif]: https://github.com/qq15725/modern-gif
