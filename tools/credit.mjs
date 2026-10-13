/* The acknowledgement shown on the end screen of each 3D game, once the reading
   is over, with the styles it needs. Shared by build-3d.mjs and build-im.mjs.
   The two text-only pages are hand-written and carry their own copy. */
export const THANKS = `<aside id="thanks" aria-label="Acknowledgement">
    <p class="tk">With gratitude</p>
    <p>The idea of making this game came to me from the teaching of <b>Prof. (Dr.) Prasannanshu</b>, who asks his students to be creative, and to answer a work of literature by making something of their own.</p>
    <p class="ts">Vikas Goyanka &#183; LLB26057 &#183; National Law University, Delhi</p>
  </aside>`;

export const THANKS_CSS = `
/* the acknowledgement, after the ending */
#thanks{max-width:33rem;margin:0;padding-top:1.6rem;border-top:1px solid rgba(232,189,106,.24);text-align:center;color:#a89e8e;
 font-size:.95rem;line-height:1.7;text-wrap:pretty;opacity:0;transition:opacity 2600ms ease 1200ms}
#thanks.in{opacity:1}
#thanks p{margin:0}
#thanks b{font-weight:normal;color:#e8bd6a}
#thanks .tk{margin-bottom:.9rem;font:.64rem/1 ui-sans-serif,system-ui,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:#a08a5c}
#thanks .ts{margin-top:.9rem;font:.64rem/1.6 ui-sans-serif,system-ui,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#6b6459}
`;
