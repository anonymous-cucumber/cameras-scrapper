export const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const showTemporaryMessage = message => {
    const container = document.querySelector(".temporary-message");
    const content = container.querySelector(".content");

    content.innerText = message;
    container.classList.remove("hidden");

    setTimeout(() => {
        container.classList.add("hidden");
    }, 3000)
}