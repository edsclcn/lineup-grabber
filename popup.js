function getTargetDates() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 6 = Saturday

  // Calculate the last Saturday
  const saturday = new Date(today);
  saturday.setDate(today.getDate() - ((dayOfWeek + 1) % 7));

  // Calculate the last Wednesday
  const wednesday = new Date(today);
  wednesday.setDate(today.getDate() - ((dayOfWeek + 4) % 7));

  return { saturday, wednesday, today };
}

function formatDate(date) {
  return date.toISOString().split("T")[0]; // Format YYYY-MM-DD
}

function getFormattedDateForFilename() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}${month}${day}`; // Format YYYYMMDD
}

function setupButtons() {
  const { saturday, wednesday, today } = getTargetDates();

  // Get formatted dates
  const saturdayStr = formatDate(saturday);
  const wednesdayStr = formatDate(wednesday);
  const todayStr = formatDate(today);

  // TG & WS: Use Saturday's date
  const tgLink = `https://lyrics.mcgi.app/line-up/thanksgiving/${saturdayStr}/`;
  const wsLink = `https://lyrics.mcgi.app/line-up/worship-service/${saturdayStr}/`;

  // PM: Use Wednesday's date
  const pmLink = `https://lyrics.mcgi.app/line-up/prayer-meeting/${wednesdayStr}/`;

  // Manual: Show the container for the search textbox 
  const manualButton = document.getElementById('manual-btn');
  const searchContainer = document.querySelector('.manual-textbox-container');

  manualButton.addEventListener('click', function() {
    searchContainer.style.display = 'flex';
  });

  // Search Function: Input of the link for manual search
  function manualSearch() {
    const manualLink = document.getElementById('manual-entry').value;
    openAndLoadTable(manualLink);
    setDownloadFilename("Search");
  }

  // Search using Enter or the button
  document.getElementById('search-btn').addEventListener('click', manualSearch);

  document.getElementById('manual-entry').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        manualSearch();
    }
  });
  
  // Enable buttons based on rules
  const dayOfWeek = today.getDay();

  document.getElementById("tg-btn").disabled = !(dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 2 || dayOfWeek === 5 || dayOfWeek === 6);
  document.getElementById("ws-btn").disabled = !(dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 6);
  document.getElementById("pm-btn").disabled = !(dayOfWeek === 3 || dayOfWeek === 4 || dayOfWeek === 5);

  // Show "Loading..." immediately
  document.getElementById("loading-label").style.display = "block";
  
  // Automatically load based on priority
  if (!document.getElementById("tg-btn").disabled) {
    openAndLoadTable(tgLink);
    setDownloadFilename("TG");
  } else if (!document.getElementById("ws-btn").disabled) {
    openAndLoadTable(wsLink);
    setDownloadFilename("WS");
  } else if (!document.getElementById("pm-btn").disabled) {
    openAndLoadTable(pmLink);
    setDownloadFilename("PM");
  }

  // Set links for buttons
  document.getElementById("tg-btn").addEventListener("click", () => {
    openAndLoadTable(tgLink);
    setDownloadFilename("TG");
  });
  document.getElementById("ws-btn").addEventListener("click", () => {
    openAndLoadTable(wsLink);
    setDownloadFilename("WS");
  });
  document.getElementById("pm-btn").addEventListener("click", () => {
    openAndLoadTable(pmLink);
    setDownloadFilename("PM");
  });

  // Add download CSV button functionality
  document.getElementById("download-csv-btn").addEventListener("click", downloadCSV);
}

let activeButtonLabel = ""; // Keeps track of the active button label for naming the CSV file

function setDownloadFilename(buttonLabel) {
  activeButtonLabel = buttonLabel;
}

function openAndLoadTable(url) {
  fetch(url)
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const rows = [...doc.querySelectorAll("table tbody tr")];
      const tableBody = document.getElementById("titles-table-body");
      tableBody.innerHTML = "";

      rows.forEach((row) => {
        const title = row.children[2].textContent.trim();
        const pageButton = row.children[4].querySelector("a");

        if (title && pageButton) {
          const pageLink = pageButton.href;
          const tr = document.createElement("tr");

          // Title column (display the original format)
          const tdTitle = document.createElement("td");
          tdTitle.textContent = title;  // Preserve original format
          tr.appendChild(tdTitle);

          // Copy button column
          const tdButton = document.createElement("td");
          const copyBtn = document.createElement("button");
          copyBtn.textContent = "Copy Lyrics";
          copyBtn.className = "copy-btn";
          copyBtn.addEventListener("click", () => copyLyrics(pageLink, copyBtn));

          tdButton.appendChild(copyBtn);
          tr.appendChild(tdButton);
          tableBody.appendChild(tr);
        }
      });

      // Hide "Loading..." label once the table is populated
      document.getElementById("loading-label").style.display = "none";
    })
    .catch((err) => {
      console.error("Failed to load table:", err);
      document.getElementById("loading-label").style.display = "none";
    });
}

function downloadCSV() {
  const rows = [...document.querySelectorAll("#titles-table-body tr")];
  const titles = rows.map(row => row.children[0].textContent.trim().replace(/,/g, '').toUpperCase());  // Remove commas and convert titles to uppercase

  if (titles.length > 0) {
    const csvContent = titles.join("\n"); // Join titles with newlines
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    // Generate filename
    const date = getFormattedDateForFilename();
    const filename = `${date}_${activeButtonLabel}_line_up.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } else {
    alert("No titles available to download.");
  }
}

function copyLyrics(url, button) {
  fetch(url)
    .then((response) => response.text())
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");

      const titleElement = doc.querySelector(".post-title.entry-title");
      const contentElement = doc.querySelector(".entry-content.gridread-clearfix");

      if (titleElement && contentElement) {
        // Preserve title capitalization
        const title = titleElement.textContent.trim();
        let content = contentElement.innerHTML.trim(); // Get innerHTML to handle <br> and <p> tags

        // Replace <p> tags with a newline (\n) to separate paragraphs
        content = content.replace(/<\/p>/g, '\n');  // Ensure paragraphs are separated with a blank line.

        // Remove any remaining <p> tags
        content = content.replace(/<p>/g, ''); // Remove opening <p> tags

        // Remove any remaining <br> tags
        content = content.replace(/<br>/g, ''); // Remove opening <p> tags

        navigator.clipboard.writeText(`${title}\n\n${content}`)
          .then(() => {
            button.textContent = "Copied!";
            setTimeout(() => {
              button.textContent = "Copy Lyrics";
            }, 1500);
          })
          .catch(err => {
            console.error("Failed to copy:", err);
            alert("Failed to copy lyrics.");
          });
      } else {
        alert("Failed to extract lyrics.");
      }
    })
    .catch(err => {
      console.error("Failed to fetch lyrics page:", err);
      alert("Failed to load lyrics.");
    });
}

// Initialize
document.addEventListener("DOMContentLoaded", setupButtons);