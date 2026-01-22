// SearchResults class
export class SearchResults {
    constructor(element) {
        this.element = element;
        this.elements();
        this.create();
    }

    elements() {
        this.title = this.element.querySelector(".posts-search-title");
        this.posts = this.element.querySelectorAll(".posts-search-list");
    }

    create() {
        // Create a div with the class post-search-term and append it right after the title
        if (window.location.search.split("?query=")[1]) {
            const postSearchTerm = document.createElement("span");
            postSearchTerm.classList.add("post-search-term");
            postSearchTerm.innerHTML = window.location.search.split("?query=")[1];
            this.title.insertAdjacentElement("beforeend", postSearchTerm);   
        }
        // Create a (n) with the number of posts found
        const postCount = document.createElement("span");
        postCount.classList.add("post-count");
        postCount.innerHTML = ` (${this.posts.length})`;
        this.title.insertAdjacentElement("beforeend", postCount);
    }
}
