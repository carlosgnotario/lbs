// Image class
import gsap from "gsap";

export class Image {
    constructor(element) {
        this.element = element;
        
        this.elements();
        this.animate();
    }
    
    elements() {
        this.image = this.element.querySelector("img");
        
    }

    animate() {
        // Animation logic here
        gsap.set(this.element, {
            clipPath: "inset(100% 0% 0% 0%)",
        })
        gsap.set(this.image, {
            scale: 0.8,
        })
        gsap.to(this.element, {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: 1,
            ease: "power4.inOut",
            scrollTrigger: {
                trigger: this.element,
                start: "top bottom",
                end: "top top",
                scrub: true,
            }
        })
        gsap.to(this.image, {
            scale: 1,
            duration: 1,
            ease: "power4.inOut",
            scrollTrigger: {
                trigger: this.element,
                start: "top bottom",
                end: "top top",
                scrub: true,
            }
        })
    }
}
