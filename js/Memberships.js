// Memberships class
import gsap from "gsap";
export class Memberships {
    constructor(element) {
        this.element = element;
        this.currentTab = null;
        
        this.elements();
        this.bind();
        this.showTab(0);
    }

    elements() {
        this.togglerLinks = this.element.querySelectorAll(".memberships-toggler div:not(.memberships-indicator");
        this.tabs = this.element.querySelectorAll(".memberships-tab");
        this.indicator = this.element.querySelector(".memberships-indicator");
        this.tabs.forEach(tab => {
            tab.items = tab.querySelectorAll(".membership-plan");
            tab.items.forEach(item => {
                item.numeral = item.querySelector(".membership-pricing-number");
                item.originalNumber = item.numeral.textContent;
            });
        });
        console.log(this.togglerLinks);
        
    }

    bind() {
        this.togglerLinks.forEach((item, index) => {
            item.addEventListener("click", () => {
                if (this.currentTab === index) return;
                this.showTab(index);
            });
        });
    }

    showTab(index) {
        const currentTab = this.tabs[index];
        const left = index > this.currentTab ? true : false;
        const bgcolors = ["#FFDF10", "#72BEE0"];
        const textcolors = ["#404040", "#FFFFFF", "#A9A9A9"];

        if (this.currentTab !== null) {
            const previousTab = this.tabs[this.currentTab];
            gsap.to(previousTab.items, {
                autoAlpha: 0,
                duration: 1,
                ease: "elastic.out(1, 0.7)",
                xPercent: left ? 20 : -20,
                stagger: left ? -0.2 : 0.2
            });
            gsap.set(previousTab, {
                autoAlpha: 0,
                duration: 1,
                delay: 1
            });
        }

        
        const tl = gsap.timeline();
        tl.to(this.indicator, {
            xPercent: -50,
            duration: 1,
            left: 50 + index * 100 + "%",
            ease: "power4.out"
        }, 0);
        tl.to(this.indicator, {
            width: "20%",
            duration: 0.5,
            ease: "power4.out"
        }, 0);
        tl.to(this.indicator, {
            width: "100%",
            duration: 2,
            ease: "elastic.out(1, 1.3)",
            backgroundColor: bgcolors[index],
        }, 0.2);

        // Togglerlinks colors
        this.togglerLinks.forEach((item, i) => {
            gsap.to(item, {
                color: i === index ? textcolors[index] : textcolors[2],
                duration: 1,
                ease: "power4.out"
            });
        });

        gsap.to(currentTab, {
            autoAlpha: 1,
            duration: 1,
            ease: "power4.inOut"
        });
        gsap.fromTo(currentTab.items, {
            autoAlpha: 0,
            xPercent: left ? -20 : 20,
        }, {
            autoAlpha: 1,
            xPercent: 0,
            duration: 1,
            ease: "elastic.out(1, 0.7)",
            stagger: left ? -0.2 : 0.2,
            delay: 0.5
        });
        currentTab.items.forEach(item => {
            gsap.fromTo(item.numeral, {
                textContent: 0,
            }, {
                textContent: item.originalNumber,
                duration: 2,
                snap: { textContent: 1 },
                ease: "power2.out",
                delay: 0.5
            });
        });
        
        this.currentTab = index;
    }
}
