// HeadingWave class
import gsap from "gsap";
import { splitTextGradient } from "./modules.js";

export class HeadingWave {
    constructor(element) {
        this.element = element;
        
        this.elements();
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
        // Initialize elements here
        this.heading = Array.from(this.element.querySelectorAll(".heading-unit")).filter(
            el => {
                // Remove zero-width characters and whitespace, then check if there's actual content
                const text = el.textContent.replace(/[\u200B-\u200D\uFEFF\u00A0\s]/g, '');
                return text.length > 0;
            }
        );
        console.log(this.heading);
        
        this.image = this.element.querySelector("img");
        this.text = this.element.querySelector(".media-content");
        this.slot = this.element.querySelector(".media-slot");
    }

    split() {
        this.splitText = new g.splitText(this.heading, {
            type: "words, chars, lines",
            linesClass: "line",
            charsClass: "char",
            smartWrap: true
        });
        this.splitText.lines.forEach(line => {
            splitTextGradient(line, line.querySelectorAll(".char"));
        });
    }

    animate() {
        // Animation logic here
        this.splitText.chars && gsap.set(this.splitText.chars, {
            opacity: 0,
            scaleY: 0,
            transformOrigin: "center bottom",
        });
        this.image && gsap.set(this.image, {
            opacity: 0,
            y: "2rem"
        });
        this.text && gsap.set(this.text, {
            opacity: 0,
            y: "2rem",
        });
        this.slot && gsap.set(this.slot, {
            opacity: 0,
            y: "2rem",
        });
        // Animations
        this.image && gsap.to(this.image, {
            opacity: 1,
            duration: 1,
            y: 0,
            ease: "power4.inOut",
            scrollTrigger: {
                trigger: this.image,
                start: "top bottom",
                end: "bottom top",
                toggleActions: "play none none reset",
            },
        });
        this.text && gsap.to(this.text, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power4.inOut",
            scrollTrigger: {
                trigger: this.text,
                start: "top bottom",
                end: "bottom top",
                toggleActions: "play none none reset",
            },
        });
        this.slot && gsap.to(this.slot, {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power4.inOut",
            scrollTrigger: {
                trigger: this.slot,
                start: "top bottom",
                end: "bottom top",
                toggleActions: "play none none reset",
            },
        });
        this.splitText.chars && gsap.to(this.splitText.chars, {
            opacity: 1,
            scaleY: 1,
            ease: "elastic.out(1, 0.7)",
            stagger: {
                amount: 1
            },
            scrollTrigger: {
                trigger: this.splitText.chars,
                start: "top bottom",
                end: "bottom top",
                toggleActions: "play none none reset",
            },
        });
        
    }
}
