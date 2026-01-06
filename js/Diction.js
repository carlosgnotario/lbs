// Diction class
import gsap from "gsap";
import SplitText from "gsap/SplitText";
// custombounce
import CustomEase from "gsap/CustomEase";
import CustomBounce from "gsap/CustomBounce";

export class Diction {
    constructor(element) {
        gsap.registerPlugin(CustomEase, CustomBounce);
        this.element = element;
        // get the [diction] value
        this.direction = element.getAttribute("diction");
        console.log("direction", this.direction);
        this.color1 = getComputedStyle(element).getPropertyValue("--diction-color1");
        this.color2 = getComputedStyle(element).getPropertyValue("--diction-color2");        
        
        this.create();
        this.split();
        this.animate();
    }

    create() {
        // Add a dot
        this.dot = document.createElement("div");
        this.dot.classList.add("dot");
        this.element.appendChild(this.dot);
    }

    split() {
        this.splitText = new SplitText(this.element, {
            type: "chars",
        });
    }

    animate() {
        gsap.from(this.splitText.chars, {
            opacity: 0,
            duration: 1,
            transformOrigin: this.direction === "over" ? "center top" : "center bottom",
            scaleY: 0,
            ease: "elastic.out(1, 0.7)",
            delay: 1,
            stagger: {
                amount: 1,
            },
        });

        // Dot animation
        const tl = gsap.timeline();
        gsap.set(this.dot, {
            autoAlpha: 0,
            backgroundColor: this.color1,
        });
        tl.to(this.dot, {
            autoAlpha: 1,
            duration: 0.2,
            ease: "none",
            delay: 1,
        });
        tl.to(this.dot, {
            left: "calc(100% - 0.5rem)",
            backgroundColor: this.color2,
            duration: 2,
            // ease: "none",
            ease: "power1.out",
            delay: 1,
        }, 0);
        tl.fromTo(this.dot, {
            top: this.direction === "over" ? "-40%" : "140%",
        }, {
            top: this.direction === "over" ? "20%" : "80%",
            duration: 4,
            ease: "bounce({strength:4, endAtStart:false})",
            delay: 1,
        }, 0);
        tl.to(this.dot, {
            autoAlpha: 0,
            duration: 0.2,
            ease: "none",
            delay: 1,
        }, 1.8);
    }
}

