
document.addEventListener("DOMContentLoaded", function () {
    //gallery
    const gallery = document.getElementById("gallery");
    const addBtn = document.getElementById("addPlanBtn");
    const planModal = document.getElementById("planModal");
    const planNameInput = document.getElementById("planNameInput");
    const checklistPreview = document.getElementById("checklistPreview");
    const savePlanBtn = document.getElementById("savePlanBtn");
    const cancelPlanBtn = document.getElementById("cancelPlanBtn");

    //checklist
    const viewChecklistModal = document.getElementById('viewChecklistModal');
    const viewChecklistTitle = document.getElementById('viewChecklistTitle');
    const viewChecklistContent = document.getElementById('viewChecklistContent');
    const closeViewChecklistBtn = document.getElementById('closeViewChecklistBtn');

    // interests
    const interestsPreview = document.getElementById('interestsPreview');
    const viewInterestsContent = document.getElementById('viewInterestsContent');

    //getting the checklist data from local storage
    //decrypting checklist data
    const SHIFT = 5;  // Same shift value

    function simpleDecrypt(text) {
    return text.split('').map(char => 
        String.fromCharCode(char.charCodeAt(0) - SHIFT)
    ).join('');
    }

    function getChecklistData() {
        const encrypted = localStorage.getItem('checklist');
        if (!encrypted) return [];
      
        try {
          const decrypted = simpleDecrypt(encrypted);
          return JSON.parse(decrypted) || [];
        } catch (error) {
          console.error('Decryption failed:', error);
          return [];
        }
      }

    function displayChecklistInModal() {
        const checklistData = getChecklistData();
        const checklistOutput = checklistData.map(item => `${item.checked ? "[X]" : "[ ]"} ${item.text}`).join('\n');
        checklistPreview.textContent = checklistOutput || "No items in checklist.";
    }

    //displaying interests
    function displayInterests() {
        const interests = JSON.parse(localStorage.getItem('interests')) || [];
        const budget = localStorage.getItem('travelBudget') || "Not specified";
    
        if (interests.length === 0) {
            return "No interests selected.";
        }
    
        return `Selected Interests:\n${interests.join(", ")}\n\nBudget: $${budget}`;
    }

    
    //making the title editable when clicked
    function makeEditable(titleDiv) {
        let currentText = titleDiv.innerText;
        let input = document.createElement("input");
        input.type = "text";
        input.value = currentText;
        input.classList.add("plan-editor");

        titleDiv.innerHTML = "";
        titleDiv.appendChild(input);
        input.focus();

        input.addEventListener("blur", function () {
            titleDiv.innerText = this.value.trim() || currentText;
        });

        input.addEventListener("keypress", function (event) {
            if (event.key === "Enter") {
                titleDiv.innerText = this.value.trim() || currentText;
                savePlansToStorage()
            }
        });
    }

    function createPlanCard(title = "New Plan", imageSrc = "../images/placeholder.jpg", checklistText = "", interestsText = "") {
        const card = document.createElement("div");
        card.className = "plan-card";
        // saving snapshots of the checklist and the interests
        card.dataset.checklist = checklistText;
        card.dataset.interests = interestsText;

        const img = document.createElement("img");
        img.src = imageSrc;
        img.alt = title;

        const titleDiv = document.createElement("div");
        titleDiv.className = "plan-title";
        titleDiv.innerText = title;
        titleDiv.addEventListener("click", () => makeEditable(titleDiv));

        const viewBtn = document.createElement("a");
        viewBtn.href = "#";
        viewBtn.className = "view-button";
        viewBtn.innerText = "View";
        viewBtn.addEventListener("click", (e) => {
            e.preventDefault();
            viewChecklistTitle.innerText = titleDiv.innerText;
            viewChecklistContent.textContent = card.dataset.checklist || "No checklist available.";
            viewInterestsContent.textContent = card.dataset.interests || "No interests available.";
            viewChecklistModal.style.display = "flex";
        });

        // closing the checklist modal
        closeViewChecklistBtn.addEventListener("click", () => {
            viewChecklistModal.style.display = "none";
        });
        
        

        const copyBtn = document.createElement("button");
        copyBtn.className = "copy-button";
        copyBtn.innerText = "Copy";
        copyBtn.addEventListener("click", () => {
            const beforeCount = document.querySelectorAll('.plan-card:not(.add-plan-card)').length;
            const originalTitle = titleDiv.innerText;
            const originalImgSrc = img.src;
            const originalChecklist = card.dataset.checklist;
            const originalInterests = card.dataset.interests;
        
            const copy = createPlanCard(originalTitle, originalImgSrc, originalChecklist, originalInterests);
            gallery.insertBefore(copy, addBtn);
        
            setTimeout(() => {
                testCopyPlan(beforeCount, originalTitle, originalImgSrc);
            }, 50);
            savePlansToStorage()
        });

        const exportBtn = document.createElement("button");
        exportBtn.className = "export-button";
        exportBtn.innerText = "Export";
        exportBtn.addEventListener("click", async () => {
            const { jsPDF } = window.jspdf;

            const originalTitle = titleDiv.innerText;
            const checklistText = card.dataset.checklist;
            const originalInterests = card.dataset.interests;
        
            const doc = new jsPDF();
            doc.addFont("NotoSans-VariableFont_wdth,wght");
            let y = 10;
        
            doc.setFontSize(36);
            const pageWidth = doc.internal.pageSize.getWidth();      // e.g. 210 for A4
            const textWidth = doc.getTextWidth(originalTitle);       // dynamic width of the title
            const x = (pageWidth - textWidth) / 2;                    // horizontal center
            doc.text(`${originalTitle}`, x, y);
            y += 15;
        
            doc.setFontSize(24);
            doc.text("Checklist:", 10, y);
            y += 8;

            // Split the checklist text into individual lines
            const checklistItems = checklistText.split("\n");

            doc.setFontSize(14);
            checklistItems.forEach(item => {
                doc.text(item, 10, y);
                y += 8;
            });
        
            y += 5;
            doc.setFontSize(14);
            doc.text(`${originalInterests}`, 10, y);
        
            // Save the PDF
            doc.save(`${originalTitle}.pdf`);
        })
        

        const deleteBtn = document.createElement("button");
        deleteBtn.className = "delete-button";
        deleteBtn.innerText = "❌";
        deleteBtn.addEventListener("click", () => {
            const planName = titleDiv.innerText;
            const confirmDelete = confirm(`Would you like to delete the plan: "${planName}"?`);
            if (confirmDelete) {
                const beforeCount = document.querySelectorAll('.plan-card:not(.add-plan-card)').length;
                card.remove();
                setTimeout(() => {
                    testDeletePlan(beforeCount);
                }, 50);
            }
            savePlansToStorage()
        });
        

        card.appendChild(img);
        card.appendChild(titleDiv);
        card.appendChild(viewBtn);
        card.appendChild(copyBtn);
        card.appendChild(exportBtn);
        card.appendChild(deleteBtn);
        
        return card;
    }

    //displaying the modal for the plan
    addBtn.addEventListener("click", () => {
        planModal.style.display = "flex"; // Show modal
        displayChecklistInModal();        // Load checklist data
        planNameInput.value = "";          // Reset input
        interestsPreview.textContent = displayInterests(); // Load interests data
    });

    savePlanBtn.addEventListener("click", () => {
        const planName = planNameInput.value.trim() || "New Plan";
        const beforeCount = document.querySelectorAll('.plan-card:not(.add-plan-card)').length;
        const checklistText = checklistPreview.textContent;
        const interestsText = interestsPreview.textContent;
        const newCard = createPlanCard(planName, "../images/placeholder.jpg", checklistText, interestsText);
        gallery.insertBefore(newCard, addBtn);

        planModal.style.display = "none"; // Close modal
        setTimeout(() => {
            testAddPlan(beforeCount, planName);
        }, 50);
        savePlansToStorage();
    });

    //saving plans to local storage so that they are not lost on refresh
    function savePlansToStorage() {
        const plans = Array.from(document.querySelectorAll('.plan-card:not(.add-plan-card)')).map(card => ({
            title: card.querySelector('.plan-title').innerText,
            imageSrc: card.querySelector('img').src,
            checklist: card.dataset.checklist || "",
            interests: card.dataset.interests || ""
        }));
    
        localStorage.setItem('plans', JSON.stringify(plans));
    }    

    // Cancel button
    cancelPlanBtn.addEventListener("click", () => {
        planModal.style.display = "none";
    });

    loadPlansFromStorage();

    //loading plans from local storage so that they are not lost on refresh
    function loadPlansFromStorage() {
        const savedPlans = JSON.parse(localStorage.getItem('plans')) || [];
        savedPlans.forEach(plan => {
            const newCard = createPlanCard(plan.title, plan.imageSrc, plan.checklist, plan.interests);
            gallery.insertBefore(newCard, addBtn);
        });
    }
    
    //testing the add button for plans
    function testAddPlan(beforeCount, expectedTitle) {
        const afterCount = document.querySelectorAll('.plan-card:not(.add-plan-card)').length;
        const newCard = document.querySelectorAll('.plan-card:not(.add-plan-card)')[afterCount - 1];
    
        const passed = afterCount === beforeCount + 1 && newCard.querySelector('.plan-title').innerText === expectedTitle;
        console.log('[Test Add Plan]', passed ? 'Passed' : 'Failed');
    }
    
    //testing the copy button for plans
    function testCopyPlan(beforeCount, originalTitle, originalImgSrc) {
        const allCards = Array.from(document.querySelectorAll('.plan-card:not(.add-plan-card)'));
        const afterCount = allCards.length;
        const lastCard = allCards[allCards.length - 1]; // Most recent card
    
        const copiedTitle = lastCard.querySelector('.plan-title').innerText;
        const copiedImgSrc = lastCard.querySelector('img').src;
    
        const passed =
            afterCount === beforeCount + 1 &&
            copiedTitle === originalTitle &&
            copiedImgSrc === originalImgSrc;
    
        console.log(`[Test Copy Plan] Copied "${copiedTitle}":`, passed ? 'Passed' : 'Failed');
    }
    //testing the delete button for plans
    function testDeletePlan(beforeCount) {
        const afterCount = document.querySelectorAll('.plan-card:not(.add-plan-card)').length;
        const passed = afterCount === beforeCount - 1;
        console.log('[Test Delete Plan]', passed ? 'Passed' : 'Failed');
    }
    
    
    
});
