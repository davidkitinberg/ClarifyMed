>
> # ROLE
> You are a Senior Multimedia & AI Solutions Architect.
>
> # CONTEXT
> We are enhancing the "ClarifyMed" web application by adding a **Visual
> Medical Presentation** feature.
> - The project already has a functional Frontend.
> - We have the simplified medical summary available in 5 languages.
> - Instead of a simple text output, we want a synchronized, visual
> slideshow with narration and educational content.
>
> # CORE CONSTRAINTS (CRITICAL)
> - **Language Support:** Perfect Hebrew support is mandatory for both
> text processing and audio narration.
> - **API Usage:** You are authorized to use the **Google Cloud API
> suite** (already configured/available).
> - **Paid Services:** You are strictly limited to using **maximum ONE
> (1) paid external API** for the entire presentation workflow (e.g.,
> for premium TTS or specialized video tools).
>
> # TASK
> Implement the presentation generation logic and integrate it into the
> existing UI:
>
> 1. **Slide Generation & Enrichment:**
>    - Segment the summary into logical "Slides" (Introduction,
> Diagnosis, Explanation, Treatment, Next Steps).
>    - Use the **Google Gemini API** to generate a brief, 2-3 sentence
> educational background for any medical condition mentioned to help the
> patient understand their situation better.
>
> 2. **Multilingual Narration (TTS):**
>    - Implement **Google Cloud Text-to-Speech** (Wavenet voices) to
> narrate the slides. Ensure high-quality Hebrew voice output.
>    - The narration must match the user's selected language from the site.
>
> 3. **Visual Synchronization:**
>    - Build a logic that syncs the slide transitions with the audio duration.
>    - Include synchronized **Subtitles** at the bottom of the
> presentation in the selected language.
>
> 4. **UI Presentation:**
>    - Design each slide to be visually clean and professional using
> medical icons (e.g., Lucide-React).
>    - The presentation should play within a modern, responsive "Player"
> component.
>
> 5. **Integration into `_ClarifyMed`:**
>    - Integrate this entire workflow into the existing `_ClarifyMed` frontend.
>    - Ensure the "Generate" button triggers this sequence and that the
> output replaces the static text result with this interactive
> presentation.
>
> # DELIVERABLE
> Update the frontend components and provide the integration code to
> transform the processed data into a narrated, visual presentation
> within the ClarifyMed UI.
