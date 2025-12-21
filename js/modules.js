// JavaScript Modules
import { Button } from "./Button.js";
import { Roller } from "./Roller.js";
import { Hex } from "./Hex.js";
import { ShrinkText } from "./ShrinkText.js";
import { Testimonials } from "./Testimonials.js";
import { FaqElements } from "./FaqElements.js";

if (typeof document !== "undefined") {
    document.addEventListener("DOMContentLoaded", () => {
        const g = {}
        window.g = g;

        g.pxToRem = (px) => {
            return ( px / 16 * 1 ) + "rem";
        }

        getFontSize();
        window.addEventListener('resize', () => {
            getFontSize();
        });
        // Classes
        const buttonElements = document.querySelectorAll(".button");
        buttonElements.forEach(element => {
            new Button(element);
        });

        const rollerElements = document.querySelectorAll(".logo-roller-logos");
        rollerElements.forEach(element => {
            new Roller(element);
        });

        const hexElements = document.querySelectorAll(".bg-hex");
        hexElements.forEach(element => {
            new Hex(element);
        });

        const shrinkText = document.querySelectorAll("[data-shrink]");
        shrinkText.forEach(element => {
            new ShrinkText(element);
        });

        const testimonialElements = document.querySelectorAll("[testimonial]");
        testimonialElements.forEach(element => {
            new Testimonials(element);
        });

        const faqElements = document.querySelectorAll("[faq]");
        faqElements.forEach(element => {
            new FaqElements(element);
        });
    });
}


function getFontSize() {
    const breakpoint = window.innerWidth < 768 ? "small" : window.innerWidth < 992 ? "medium" : "desktop";
    let fontSize = breakpoint === "small" ?  document.body.clientWidth / 767 * 16 : breakpoint === "medium" ? document.body.clientWidth / 991 * 16 : Math.min(document.body.clientWidth / 1290 * 16, 1680 / 1290 * 16);
    document.documentElement.style.setProperty('--fontSize', fontSize + 'px');
}