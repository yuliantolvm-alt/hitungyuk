(() => {
  "use strict";

  const tools = {
    discount: {
      title: "Kalkulator Diskon",
      category: "KEUANGAN",
      description: "Hitung nominal diskon dan harga setelah diskon.",
      fields: [
        {id:"price", label:"Harga awal (Rp)", type:"number", min:0, max:999999999999, step:"1"},
        {id:"discount", label:"Diskon (%)", type:"number", min:0, max:100, step:"0.01"}
      ],
      calculate(v) {
        const saved = v.price * v.discount / 100;
        return {value: rupiah(v.price - saved), note:`Hemat ${rupiah(saved)} dari harga awal ${rupiah(v.price)}.`};
      }
    },
    percentage: {
      title: "Kalkulator Persentase",
      category: "MATEMATIKA",
      description: "Hitung A sebagai persentase dari B.",
      fields: [
        {id:"part", label:"Nilai A", type:"number", min:-999999999999, max:999999999999, step:"any"},
        {id:"whole", label:"Nilai B", type:"number", min:-999999999999, max:999999999999, step:"any"}
      ],
      calculate(v) {
        if (v.whole === 0) throw new Error("Nilai B tidak boleh 0.");
        return {value: formatNumber(v.part / v.whole * 100, 2) + "%", note:`${formatNumber(v.part,2)} adalah ${formatNumber(v.part/v.whole*100,2)}% dari ${formatNumber(v.whole,2)}.`};
      }
    },
    age: {
      title: "Kalkulator Umur",
      category: "WAKTU",
      description: "Hitung usia berdasarkan tanggal lahir hingga hari ini.",
      fields: [
        {id:"birth", label:"Tanggal lahir", type:"date"}
      ],
      calculate(v) {
        const birth = parseDate(v.birth);
        const now = new Date();
        now.setHours(0,0,0,0);
        if (birth > now) throw new Error("Tanggal lahir tidak boleh di masa depan.");
        let years = now.getFullYear() - birth.getFullYear();
        let months = now.getMonth() - birth.getMonth();
        let days = now.getDate() - birth.getDate();
        if (days < 0) { months--; days += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); }
        if (months < 0) { years--; months += 12; }
        return {value:`${years} tahun ${months} bulan ${days} hari`, note:"Hasil adalah estimasi usia kalender berdasarkan tanggal hari ini di perangkat Anda."};
      }
    },
    bmi: {
      title: "Kalkulator BMI",
      category: "KESEHATAN",
      description: "Hitung indeks massa tubuh berdasarkan berat dan tinggi.",
      fields: [
        {id:"weight", label:"Berat (kg)", type:"number", min:1, max:500, step:"0.1"},
        {id:"height", label:"Tinggi (cm)", type:"number", min:50, max:250, step:"0.1"}
      ],
      calculate(v) {
        const bmi = v.weight / Math.pow(v.height / 100, 2);
        let category = bmi < 18.5 ? "di bawah rentang normal" : bmi < 25 ? "rentang normal" : bmi < 30 ? "di atas rentang normal" : "obesitas menurut klasifikasi BMI dewasa";
        return {value:formatNumber(bmi,1), note:`BMI Anda berada pada ${category}. BMI adalah alat skrining, bukan diagnosis medis.`};
      }
    },
    area: {
      title: "Kalkulator Luas Persegi Panjang",
      category: "MATEMATIKA",
      description: "Hitung luas bidang dari panjang dan lebar.",
      fields: [
        {id:"length", label:"Panjang (meter)", type:"number", min:0, max:1000000, step:"any"},
        {id:"width", label:"Lebar (meter)", type:"number", min:0, max:1000000, step:"any"}
      ],
      calculate(v) {
        return {value:formatNumber(v.length*v.width,2) + " m²", note:"Rumus: panjang × lebar."};
      }
    },
    convert: {
      title: "Konversi Berat",
      category: "KONVERSI",
      description: "Konversi kilogram, gram, miligram, dan ton.",
      fields: [
        {id:"amount", label:"Nilai", type:"number", min:0, max:999999999999, step:"any"},
        {id:"from", label:"Dari", type:"select", options:["kg","gram","mg","ton"]},
        {id:"to", label:"Ke", type:"select", options:["kg","gram","mg","ton"]}
      ],
      calculate(v) {
        const base = {kg:1000, gram:1, mg:0.001, ton:1000000};
        const result = v.amount * base[v.from] / base[v.to];
        return {value:formatNumber(result,6) + " " + v.to, note:`Konversi ${formatNumber(v.amount,6)} ${v.from} ke ${v.to}.`};
      }
    }
  };

  const $ = (selector) => document.querySelector(selector);
  const toolGrid = $("#toolGrid");
  const search = $("#toolSearch");
  const panel = $("#calculatorPanel");
  const form = $("#calculatorForm");
  const fields = $("#formFields");
  const error = $("#formError");
  const result = $("#resultBox");
  const resultValue = $("#resultValue");
  const resultNote = $("#resultNote");
  let activeTool = null;

  function formatNumber(value, digits=2) {
    return new Intl.NumberFormat("id-ID", {maximumFractionDigits:digits}).format(value);
  }

  function rupiah(value) {
    return new Intl.NumberFormat("id-ID", {style:"currency", currency:"IDR", maximumFractionDigits:0}).format(value);
  }

  function parseDate(value) {
    const [y,m,d] = value.split("-").map(Number);
    return new Date(y,m-1,d);
  }

  function showError(message) {
    error.textContent = message;
    error.hidden = false;
    result.hidden = true;
  }

  function clearError() {
    error.textContent = "";
    error.hidden = true;
  }

  function renderFields(tool) {
    fields.replaceChildren();
    for (const field of tool.fields) {
      const wrapper = document.createElement("div");
      wrapper.className = "field";
      const label = document.createElement("label");
      label.htmlFor = field.id;
      label.textContent = field.label;
      wrapper.appendChild(label);

      let input;
      if (field.type === "select") {
        input = document.createElement("select");
        for (const option of field.options) {
          const el = document.createElement("option");
          el.value = option;
          el.textContent = option;
          input.appendChild(el);
        }
      } else {
        input = document.createElement("input");
        input.type = field.type;
        if (field.min !== undefined) input.min = String(field.min);
        if (field.max !== undefined) input.max = String(field.max);
        if (field.step !== undefined) input.step = field.step;
        input.inputMode = field.type === "number" ? "decimal" : "text";
      }
      input.id = field.id;
      input.name = field.id;
      input.required = true;
      wrapper.appendChild(input);
      fields.appendChild(wrapper);
    }
  }

  function openTool(key) {
    activeTool = tools[key];
    $("#calculatorCategory").textContent = activeTool.category;
    $("#calculatorTitle").textContent = activeTool.title;
    $("#calculatorDescription").textContent = activeTool.description;
    renderFields(activeTool);
    clearError();
    result.hidden = true;
    panel.hidden = false;
    panel.scrollIntoView({behavior:"smooth", block:"start"});
  }

  toolGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-tool]");
    if (card) openTool(card.dataset.tool);
  });

  $("#closeCalculator").addEventListener("click", () => {
    panel.hidden = true;
    result.hidden = true;
    $("#kalkulator").scrollIntoView({behavior:"smooth"});
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    clearError();

    try {
      const values = {};
      for (const field of activeTool.fields) {
        const input = document.getElementById(field.id);
        if (field.type === "number") {
          const raw = input.value.trim();
          if (raw === "") throw new Error(`${field.label} wajib diisi.`);
          const value = Number(raw);
          if (!Number.isFinite(value)) throw new Error(`${field.label} harus berupa angka.`);
          if (field.min !== undefined && value < field.min) throw new Error(`${field.label} terlalu kecil.`);
          if (field.max !== undefined && value > field.max) throw new Error(`${field.label} terlalu besar.`);
          values[field.id] = value;
        } else if (field.type === "date") {
          if (!input.value) throw new Error(`${field.label} wajib diisi.`);
          values[field.id] = input.value;
        } else {
          values[field.id] = input.value;
        }
      }

      const output = activeTool.calculate(values);
      resultValue.textContent = output.value;
      resultNote.textContent = output.note;
      result.hidden = false;
    } catch (err) {
      showError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    }
  });

  search.addEventListener("input", () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll(".tool-card").forEach(card => {
      const match = card.textContent.toLowerCase().includes(q);
      card.hidden = !match;
      if (match) visible++;
    });
    $("#emptyState").hidden = visible !== 0;
  });
})();
