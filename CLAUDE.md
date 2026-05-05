I have a web application called ClarifyMed built with React + Vite.

I need you to integrate the frontend UI with my existing backend code.


## The Frontend Has:

1. A file drop-zone for uploading a medical document (PDF/image)

2. A voice recording drop-zone for uploading an audio file

3. A language selector (Hebrew, English, Russian, Arabic, Amharic)

4. A "Generate Avatar Video" button


## My Backend Does: FromDoc&AudioToTxt

- Accepts a medical document (PDF/text/image) → converts it to text

- Accepts a voice recording → transcribes it to text

- Can accept both inputs together

- Returns the processed text as output


## What I Need You To Do:

1. Connect the file drop-zone so that when a user uploads a medical

   document, it sends the file to the correct backend function/endpoint


2. Connect the voice recording drop-zone so that when a user uploads

   an audio file, it sends it to the correct transcription function


3. When the "Generate Avatar Video" button is clicked:

   - Collect whichever inputs the user provided (document, audio, or both)

   - FromDoc&AudioToTxtSend them to the backend

   - Wait for the text output

   - Display the result on screen


4. Pass the selected language to the backend so the output is

   returned in the correct language


5. Add loading states to the UI while the backend is processing


6. Add error handling if something goes wrong


## Notes:

- Here is my backend code: FromDoc&AudioToTxt

- The frontend code is in /src/app/components/

- The main input component is InputZone.tsx

- The button component is ActionButton.tsx
