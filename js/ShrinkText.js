// ShrinkText class
export class ShrinkText {
    constructor(element) {
        this.element = element;
        this.sizing();
        console.log("works")
        // this.fitText();
    }

    sizing() {
        let newFontSize = 1;
        
        this.ticking = true;

        const resizeObserver = new ResizeObserver(() => {
            // this.fitText();
        });
        resizeObserver.observe(this.element);

    }

    fitText() {
        const el = this.element;
        const containerHeight = el.clientHeight;
    
        // Get current size in rem
        const computedPx = parseFloat(getComputedStyle(el).fontSize);
        const rootPx = parseFloat(getComputedStyle(document.documentElement).fontSize);
        const startSize = computedPx / rootPx;
    
        // If it already fits, do nothing
        if (el.scrollHeight <= containerHeight) return;
    
        let high = startSize;
        let low = 0.1; // minimum rem you allow
        let best = low;
    
        while (low <= high) {
            const mid = (low + high) / 2;
            el.style.fontSize = `${mid}rem`;
    
            if (el.scrollHeight <= containerHeight) {
                best = mid;
                low = mid + 0.01; // try slightly larger (but never above startSize)
            } else {
                high = mid - 0.01;
            }
        }
    
        el.style.fontSize = `${best}rem`;
    }
}

