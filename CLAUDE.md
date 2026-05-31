# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

This is a maze game. It is like pacman. It has paths which led to flowers or hedges. The user is a butterfly that canbe  controled by the arrow keys or a onscreen arrows to press on. 
The user''s goal is to go to the flowers and press the space bar (or a space bar on the screen). While this happens the butterfly drains the pollen points out of  the flower which eventually is used up.
The user goes from flower to flower while trying to avoid the butterfly catcher who randomly walks through the path. If the butterfly gets caught by the catcher then they lose a life.
The user has 3 lives and gets a new life whenever they finish a level by draining all the flower pollen. The user points for the pollen is always shown as their score. On each new level, another catcher is added.
There should be 5 levels for now. There are also hedges which a butterfly can go behind where the catchers can't see them.
The game should be cartoony similar to pacman.

## Tech Stack
The game should be a progressive web app that allows users to play on the web or to download to their phone.
It should be broken up into smaller pieces and use Node Js to publish the application.

