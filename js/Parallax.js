// Parallax class
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export class Parallax {
    constructor(element) {
        this.element = element;

        this.elements();

        const initiate = () => {
            this.sizing();
            this.animate();
            g.scrollTrigger.refresh();
        }
        
        // wait for the image to load or check if it's loaded
        if (this.image.complete) {
            console.log("image loaded");
            
            initiate();
        } else {
            this.image.addEventListener("load", () => {
                console.log("image loaded");
                initiate();
            });
        }

        window.addEventListener("resize", () => {
            this.sizing();
            g.scrollTrigger.refresh();
        });
    }

    elements() {
        this.wrapper = this.element.querySelector("[data-parallax='wrapper']");
        this.image = this.element.querySelector("[data-parallax-image]");
        this.direction = this.image.getAttribute("data-parallax-image") === "down" ? "up" : "up";
        
    }

    sizing() {
        this.wrapperHeight = this.wrapper.offsetHeight;
        this.imageHeight = this.image.getBoundingClientRect().height;
        this.travelDistance = this.imageHeight - this.wrapperHeight;
        console.log("wrapperHeight", this.wrapperHeight, "imageHeight", this.imageHeight, "travelDistance", this.travelDistance);
    }

    animate() {
        // Calculate how far the image needs to travel
        
        // Set initial position (image at bottom of wrapper)
        gsap.set(this.image, {
            y: this.direction === "up" ? -this.travelDistance : 0
        });

        // Create ScrollTrigger animation
        this.scrollTrigger = gsap.to(this.image, {
            y: this.direction === "up" ? 0 : -this.travelDistance,
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
