// VideoModal class
import gsap from "gsap";

export class Video {
    constructor(element) {
        this.element = element;
        this.open = false;

        this.elements();
        this.bind();
    }

    elements() {
        this.modal = document.querySelector(".video-modal");
        this.videoWrapper = this.modal.querySelector(".video-modal-video");
        this.closeButton = this.modal.querySelector(".video-modal-close");
        this.videoURL = this.element.dataset.video;
    }

    bind() {
        this.element.addEventListener("click", () => {
            if (this.open) { return; }
            this.openModal()
        });

        this.modal.addEventListener("click", () => {
            if (!this.open) { return; }
                this.closeModal()
        });

        this.videoWrapper.addEventListener("click", (e) => {
            e.stopPropagation();
        });
    }

    openModal() {
        // let embedUrl = video.includes("vimeo.com")
        //     ? `https://player.vimeo.com/video/${video.split("/").pop()}?autoplay=1`
        //     : `https://www.youtube.com/embed/${video.split("v=")[1]}?autoplay=1`;
        // this.testimonialModal.innerHTML = `<iframe width="560" height="315" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="pointer-events: auto; touch-action: auto;"></iframe>`;
        // Append Video
        const embedUrl = this.videoURL.includes("vimeo.com")
            ? `https://player.vimeo.com/video/${this.videoURL.split("/").pop()}?autoplay=1`
            : `https://www.youtube.com/embed/${this.videoURL.split("v=")[1]}?autoplay=1`;
        this.videoWrapper.innerHTML = `<iframe width="100%" height="100%" src="${embedUrl}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen style="pointer-events: auto; touch-action: auto;"></iframe>`;
        gsap.to(this.modal, {
            autoAlpha: 1,
            duration: 1,
            ease: "power4.inOut"
        });
        this.open = true;
    }

    closeModal() {
        gsap.to(this.modal, {
            autoAlpha: 0,
            duration: 1,
            ease: "power4.inOut",
            onComplete: () => {
                this.videoWrapper.innerHTML = "";
            }
        });
        this.open = false;
    }
}

