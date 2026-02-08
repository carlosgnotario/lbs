// Balls class
export class Balls {
    constructor(element) {
        this.element = element;

        this.elements();
        // this.animate();
        this.animateLow();
    }
    
    elements() {
        // Initialize elements here
        this.balls = this.element.querySelectorAll("[data-target='ball']");
    }

    animate() {
        gsap.set(this.balls, {
            xPercent: -100,
            autoAlpha: 0,
            rotate: -180
        })
        // Animation logic here
        gsap.to(this.balls, {
            xPercent: 0,
            rotate: 0,
            autoAlpha: 1,
            duration: 2,
            ease: "elastic.out(1, 0.7)",
            stagger: {
                each: 0.3
            },
            scrollTrigger: {
                trigger: this.element,
                start: "top bottom",
                end: "bottom top",
                toggleActions: "play none none reset",
            }
        })
    }

    animateLow() {
        gsap.set(this.balls, {
            y: 30,
            autoAlpha: 0,
        })
        gsap.to(this.balls, {
            y: 0,
            autoAlpha: 1,
            duration: 1,
            ease: "power4.out",
            delay: 0.2,
            scrollTrigger: {
                trigger: this.element,
                start: "top bottom",
                end: "bottom top",
                toggleActions: "play none none reset",
            }
        })
    }
}
