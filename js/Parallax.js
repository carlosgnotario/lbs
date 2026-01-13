// Parallax class
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export class Parallax {
    constructor(element) {
        this.element = element;
        console.log("parallax", this.element);

        this.elements();
        this.sizing();
        this.animate();

        window.addEventListener("resize", () => {
            this.sizing();
            if (this.scrollTrigger) {
                this.scrollTrigger.refresh();
            }
        });
    }

    elements() {
        this.wrapper = this.element.querySelector(".parallax");
        this.image = this.element.querySelector(".parallax-img");
    }

    sizing() {
        this.wrapperHeight = this.wrapper.offsetHeight;
        this.imageHeight = this.image.offsetHeight;
    }

    animate() {
        // Calculate how far the image needs to travel
        const travelDistance = this.imageHeight - this.wrapperHeight;
        
        // Set initial position (image at bottom of wrapper)
        gsap.set(this.image, {
            y: -travelDistance
        });

        // Create ScrollTrigger animation
        this.scrollTrigger = gsap.to(this.image, {
            y: 0,
            ease: "none",
            scrollTrigger: {
                trigger: this.wrapper,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            }
        });
    }
}
