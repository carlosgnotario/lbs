import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText.js";

// Register SplitText with GSAP
gsap.registerPlugin(SplitText);

// Button class
export class Button {
    constructor(element) {
        this.element = element;
        console.log("button");
        
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(() => {
                this.elements()
                this.splitWords()
                this.bind()
			})
		}
    }

    elements() {
        this.text = this.element.querySelector("div")
    }

    splitWords() {
        this.splitText = new SplitText(this.text, {
            type: "chars",
        });
    }

    bind() {
        this.element.addEventListener("mouseenter", () => {
            const tl = gsap.timeline();
            tl.to(this.splitText.chars, {
                duration: 1,
                rotate: (index) => -10 + index / this.splitText.chars.length * 20,
                x: (index) => -5 + index / this.splitText.chars.length * 10,
                y: (index) => -5 * Math.abs(index - this.splitText.chars.length / 2) / (this.splitText.chars.length / 2),
                ease: "elastic.out(1, 0.3)",
                stagger: {
                    amount: 0.6,
                },
                scaleY: 0.5,
                transformOrigin: "center top",
            });
            tl.to(this.splitText.chars, {
                duration: 1,
                rotate: 0,
                x: 0,
                y: 0,
                ease: "elastic.out(1, 0.3)",
                overwrite: "auto",
                scaleY: 1,
                stagger: {
                    amount: 0.6,
                },
            }, "<0.3");
        });
    }
}

