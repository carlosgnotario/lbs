// Megamenu class
import gsap from "gsap";

export class Megamenu {
    constructor(element) {
        this.element = element;
        this.isShowing = false;
        this.currentTarget = null;

        this.elements();
        this.binds();
        this.update();
        this.sizing();
        this.spotlight();

        window.addEventListener("resize", () => {
            this.sizing();
        });
    }

    elements() {
        this.wrapper = this.element.querySelector(".header-megamenu");
        this.logo = this.element.querySelector(".header-logo");
        this.menu = this.element.querySelector(".header-menu");
        this.links = this.element.querySelectorAll("[megamenu-link='0']");
        this.menuLinks = this.element.querySelectorAll("[megamenu-link='1']");
        this.menuTargets = this.element.querySelectorAll("[megamenu-target]");
        this.megamenuWrapper = this.element.querySelector(".header-megamenu");
        console.log(this.menuLinks, this.menuTargets);

        gsap.set(this.menuTargets, {
            opacity: 0
        });
    }

    binds() {
        console.log("binds");
        
        this.menuLinks.forEach((link, index) => {
            link.addEventListener("mouseenter", () => {                
                if (!this.isShowing) {
                    this.isShowing = true;
                    console.log("show menu");
                    this.showMegamenu(true);
                }
                link.classList.add("active");
                if (this.currentTarget !== null && this.currentTarget !== index) {
                    this.menuLinks[this.currentTarget].classList.remove("active");
                }
                if (this.currentTarget === index) return;
                this.showMenu(index);  
            });
        });

        this.element.addEventListener("mouseleave", () => {
            if (!this.isShowing) return;
            this.isShowing = false;
            console.log("hide menu");
            this.showMegamenu(false);
            if (this.currentTarget !== null) {
                this.menuLinks[this.currentTarget].classList.remove("active");
            }
        });

        this.links.forEach(link => {
            link.addEventListener("mouseenter", () => {
                if (!this.isShowing) return;
                this.isShowing = false;
                console.log("hide menu");
                this.showMegamenu(false);
                if (this.currentTarget !== null) {
                    this.menuLinks[this.currentTarget].classList.remove("active");
                }
            });
        });

        this.menu.addEventListener("mouseenter", (e) => {
            e.preventDefault();
        });
    }

    observe() {
        // Add a resize observer to the element
        const resizeObserver = new ResizeObserver(() => {
            this.sizing();            
        });
        resizeObserver.observe(this.element);
    }

    sizing() {
        this.left = this.megamenuWrapper.getBoundingClientRect().left;
        this.top = this.megamenuWrapper.getBoundingClientRect().top;
        console.log(this.left, this.top);
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
        gsap.set(this.megamenuWrapper, {
            autoAlpha: show ? 0 : 1,
            y: show ? 100 : 0,
        });
        gsap.to(this.megamenuWrapper, {
            autoAlpha: show ? 1 : 0,
            duration: 1,
            y: show ? 0 : 100,
            ease: "power4.out"
        });
        
        this.megamenuShowing = show;
    }

    update() {
        this.menuSmall = false;
        this.ticker = () => {
            if (window.lenis.targetScroll > 0 && !this.menuSmall) {
                this.menuSmall = true;
                gsap.to(this.logo, {
                    padding: "1rem 0",
                })
            } else if (window.lenis.targetScroll <= 0 && this.menuSmall) {
                this.menuSmall = false;
                gsap.to(this.logo, {
                    // reset padding
                    padding: "2.125rem 0",

                })
            }
        }
        gsap.ticker.add(this.ticker);
    }
}
