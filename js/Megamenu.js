// Megamenu class
import gsap from "gsap";

export class Megamenu {
    constructor(element) {
        this.element = element;
        this.megamenuWrapper = this.element.querySelector(".header-megamenu");
        // Only the ones with a value
        this.menuLinks = Array.from(this.element.querySelectorAll("[megamenu-link]")); 
        this.menuTargets = Array.from(this.element.querySelectorAll("[megamenu-target]"));

        // if menuLinks and targets are not the same length, remove the ones that have more length until they are equal from the last
        while (this.menuLinks.length !== this.menuTargets.length) {
            if (this.menuLinks.length > this.menuTargets.length) {
                this.menuLinks.splice(this.menuLinks.length - 1, 1);
            } else {
                this.menuTargets.splice(this.menuTargets.length - 1, 1);
            }
        }

        if (this.menuLinks.length !== this.menuTargets.length) {
            console.error("menuLinks and menuTargets must have the same length");
            return;
        }
        
        this.currentTarget = null;
        this.megamenuShowing = false;

        gsap.set(this.menuTargets, {
            opacity: 0
        });

        this.sizing();
        this.observe();
        this.spotlight();
        this.interactions();
        this.update();
    }

    observe() {
        // Add a resize observer to the element
        const resizeObserver = new ResizeObserver(() => {
            this.sizing();            
        });
        resizeObserver.observe(this.element);
    }

    sizing() {
        this.left = this.megamenuWrapper.offsetLeft;
        this.top = this.megamenuWrapper.offsetTop;
    }

    spotlight() {
        this.spotlight = document.createElement("div");
        this.spotlight.classList.add("spotlight");
        this.megamenuWrapper.appendChild(this.spotlight);

        const xPos = gsap.quickTo(this.spotlight, "x");
        const yPos = gsap.quickTo(this.spotlight, "y");

        const interaction = (event) => {
            const x = event.clientX;
            const y = event.clientY;
            xPos(x - this.left);
            yPos(y - this.top);
        }
        window.addEventListener("mousemove", interaction);
    }

    interactions() {
        this.menuLinks.forEach((link, index) => {
            link.addEventListener("mouseenter", () => {
                if (!this.megamenuShowing) {
                    this.showMegamenu(true);
                }
                if (this.currentTarget === index) return;
                this.showMenu(index);        
            });
        });

        this.element.addEventListener("mouseleave", () => {
            if (!this.megamenuShowing) return;
            this.showMegamenu(false);
        });
    }

    showMenu(newIndex) {
        const targetElement = this.menuTargets[newIndex];
        const previousTarget = this.menuTargets[this.currentTarget];
        
        if (this.currentTarget !== null) {
            gsap.to(previousTarget, {
                opacity: 0,
                duration: 1,
                xPercent: this.currentTarget > newIndex ? 100 : -100,
                ease: "power4.inOut"
            });
        }
        
        if (targetElement) {
            gsap.set(targetElement, {
                xPercent: this.currentTarget !== null ? (this.currentTarget > newIndex ? -100 : 100) : 0
            });

            gsap.to(targetElement, {
                opacity: 1,
                duration: 1,
                xPercent: 0,
                ease: "power4.inOut"
            });
        }

        this.currentTarget = newIndex;
    }

    showMegamenu(show) {
        gsap.to(this.megamenuWrapper, {
            autoAlpha: show ? 1 : 0,
            duration: 1,
            ease: "power4.inOut"
        });
        
        this.megamenuShowing = show;
    }

    update() {
        this.menuSmall = false;
        this.ticker = () => {
            if (window.lenis.targetScroll > 0 && !this.menuSmall) {
                this.menuSmall = true;
                gsap.to(this.element, {
                    padding: "1rem 0",
                })
            } else if (window.lenis.targetScroll <= 0 && this.menuSmall) {
                this.menuSmall = false;
                gsap.to(this.element, {
                    // reset padding
                    padding: "2.125rem 0",

                })
            }
        }
        gsap.ticker.add(this.ticker);
    }
}
