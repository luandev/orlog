export default () => {
  const html = `
    <dialog open>
    <p>Greetings, let's play Orlog</p>
    <form method="dialog">
        <button>OK</button>
    </form>
    </dialog>
  `;
  document.body.insertAdjacentHTML('afterend', html);
};
