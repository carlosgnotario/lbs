// custombounce
import { splitTextGradient } from "./modules.js";

export class Diction {
    constructor(element) {
        return;
        gsap.registerPlugin(CustomEase, CustomBounce);
        this.element = element;
        // get the [diction] value
        
        this.elements();
        this.create();
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                this.split();
                this.animate();
            });
        } else {
            this.split();
            this.animate();
        }
    }
    
    elements() {
        this.text = this.element.querySelector(".anim-diction");
        console.log(this.text);
        this.color1 = getComputedStyle(this.text).getPropertyValue("--color1");
        this.color2 = getComputedStyle(this.text).getPropertyValue("--color2");

    }

    create() {
        this.dot = document.createElement("div");
        this.dot.classList.add("dot");
        this.text.appendChild(this.dot);
    }

    split() {
        this.splitText = new SplitText(this.text, {
            type: "words, chars",
            classes: "char",
        });
        splitTextGradient(this.text, this.splitText.chars);
    }

    animate() {
        // Dot animation
        gsap.set(this.dot, {
            autoAlpha: 0,
            backgroundColor: this.color1,
        });
        gsap.set(this.splitText.chars, {
            opacity: 0,
            scaleY: 0,
            transformOrigin: this.direction === "over" ? "center top" : "center bottom",
        });
        const tl = gsap.timeline({
            scrollTrigger: {
                trigger: this.text,
                start: "top 90%",
                end: "bottom 30%",
            },
        });
        tl.to(this.splitText.chars, {
            opacity: 1,
            scaleY: 1,
            duration: 1,
            stagger: {
                amount: 1,
            },
            ease: "elastic.out(1, 0.7)",
        }, 0);
        tl.to(this.dot, {
            autoAlpha: 1,
            duration: 0.2,
            ease: "none",
        }, 0);
        tl.to(this.dot, {
            left: "calc(100% - 0.5rem)",
            backgroundColor: this.color2,
            duration: 2,
            // ease: "none",
            ease: "power1.out",
        }, 0);
        tl.fromTo(this.dot, {
            top: this.direction === "over" ? "-40%" : "140%",
        }, {
            top: this.direction === "over" ? "20%" : "80%",
            duration: 4,
            ease: "bounce({strength:4, endAtStart:false})",
        }, 0);
        tl.to(this.dot, {
            autoAlpha: 0,
            duration: 0.2,
            ease: "none",
        }, 1.8);
    }
}

