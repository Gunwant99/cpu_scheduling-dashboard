const tbody =
    document.querySelector("#processTable tbody");

const summaryBody =
    document.querySelector("#summaryTable tbody");

const detailBody =
    document.querySelector("#detailTable tbody");

const timelines =
    document.querySelector("#timelines");

const detailAlgo =
    document.querySelector("#detailAlgo");


const colors = [
    "p0",
    "p1",
    "p2",
    "p3",
    "p4",
    "p5",
    "p6",
    "p7"
];


let results = {};



/* =========================
   ADD PROCESS
========================= */

function addProcess(
    p = {
        id: "P" + (tbody.children.length + 1),
        at: 0,
        bt: 4,
        pr: 1
    }
) {

    const tr =
        document.createElement("tr");


    tr.innerHTML = `

        <td>
            <input
                class="process-input pid"
                value="${p.id}"
            >
        </td>

        <td>
            <input
                type="number"
                class="at"
                min="0"
                value="${p.at}"
            >
        </td>

        <td>
            <input
                type="number"
                class="bt"
                min="1"
                value="${p.bt}"
            >
        </td>

        <td>
            <input
                type="number"
                class="pr"
                min="1"
                value="${p.pr}"
            >
        </td>

        <td>
            <button class="delete">
                ✕
            </button>
        </td>

    `;


    tr.querySelector(".delete")
        .onclick = () => {

            tr.remove();

        };


    tbody.appendChild(tr);
}



/* =========================
   SAMPLE DATA
========================= */

function loadSample() {

    tbody.innerHTML = "";


    const sample = [

        ["P1", 0, 7, 2],

        ["P2", 1, 4, 1],

        ["P3", 2, 1, 4],

        ["P4", 3, 4, 3],

        ["P5", 4, 2, 2]

    ];


    sample.forEach(x => {

        addProcess({

            id: x[0],

            at: x[1],

            bt: x[2],

            pr: x[3]

        });

    });

}



/* =========================
   GET PROCESSES
========================= */

function getProcesses() {

    return [...tbody.children].map(
        (tr, i) => {

            return {

                id:
                    tr.querySelector(".pid")
                        .value
                    || "P" + (i + 1),

                at:
                    +tr.querySelector(".at")
                        .value,

                bt:
                    +tr.querySelector(".bt")
                        .value,

                pr:
                    +tr.querySelector(".pr")
                        .value,

                index: i

            };

        }
    );

}



/* =========================
   AVERAGE
========================= */

function avg(arr) {

    if (!arr.length)
        return 0;


    return arr.reduce(
        (a, b) => a + b,
        0
    ) / arr.length;

}



/* =========================
   FINISH ROWS
========================= */

function finishRows(procs, ct) {

    return procs.map(p => {

        const turnaround =
            ct[p.id] - p.at;


        const waiting =
            turnaround - p.bt;


        return {

            ...p,

            ct: ct[p.id],

            tat: turnaround,

            wt: waiting

        };

    });

}



/* =========================
   FCFS
========================= */

function fcfs(ps) {

    const arr =
        [...ps].sort(
            (a, b) =>
                a.at - b.at ||
                a.index - b.index
        );


    const ct = {};

    const gantt = [];

    let time = 0;


    for (const p of arr) {

        if (time < p.at) {

            gantt.push({

                id: "IDLE",

                start: time,

                end: p.at

            });

            time = p.at;

        }


        const start = time;


        time += p.bt;


        ct[p.id] = time;


        gantt.push({

            id: p.id,

            start: start,

            end: time

        });

    }


    return {

        rows:
            finishRows(ps, ct),

        g: gantt

    };

}



/* =========================
   SJF
========================= */

function sjf(ps) {

    let time = 0;

    let done = 0;

    const ct = {};

    const gantt = [];

    const used = new Set();


    while (done < ps.length) {

        const available =
            ps.filter(
                p =>
                    !used.has(p.id) &&
                    p.at <= time
            );


        if (!available.length) {

            const next =
                Math.min(
                    ...ps
                        .filter(
                            p =>
                                !used.has(p.id)
                        )
                        .map(p => p.at)
                );


            gantt.push({

                id: "IDLE",

                start: time,

                end: next

            });


            time = next;

            continue;

        }


        const p =
            available.sort(
                (a, b) =>
                    a.bt - b.bt ||
                    a.at - b.at ||
                    a.index - b.index
            )[0];


        used.add(p.id);


        const start = time;


        time += p.bt;


        ct[p.id] = time;


        gantt.push({

            id: p.id,

            start: start,

            end: time

        });


        done++;

    }


    return {

        rows:
            finishRows(ps, ct),

        g: gantt

    };

}



/* =========================
   PRIORITY
========================= */

function priority(
    ps,
    preemptive = false
) {

    if (preemptive) {

        return preemptivePriority(ps);

    }


    let time = 0;

    let done = 0;

    const ct = {};

    const gantt = [];

    const used = new Set();


    while (done < ps.length) {

        const available =
            ps.filter(
                p =>
                    !used.has(p.id) &&
                    p.at <= time
            );


        if (!available.length) {

            const next =
                Math.min(
                    ...ps
                        .filter(
                            p =>
                                !used.has(p.id)
                        )
                        .map(p => p.at)
                );


            gantt.push({

                id: "IDLE",

                start: time,

                end: next

            });


            time = next;

            continue;

        }


        const p =
            available.sort(
                (a, b) =>
                    a.pr - b.pr ||
                    a.at - b.at ||
                    a.index - b.index
            )[0];


        used.add(p.id);


        const start = time;


        time += p.bt;


        ct[p.id] = time;


        gantt.push({

            id: p.id,

            start: start,

            end: time

        });


        done++;

    }


    return {

        rows:
            finishRows(ps, ct),

        g: gantt

    };

}



/* =========================
   PREEMPTIVE PRIORITY
========================= */

function preemptivePriority(ps) {

    let time = 0;

    let completed = 0;


    const remaining =
        Object.fromEntries(
            ps.map(
                p => [p.id, p.bt]
            )
        );


    const ct = {};

    const gantt = [];


    let last = null;

    let start = 0;


    while (completed < ps.length) {

        const available =
            ps.filter(
                p =>
                    p.at <= time &&
                    remaining[p.id] > 0
            );


        if (!available.length) {

            const next =
                Math.min(
                    ...ps
                        .filter(
                            p =>
                                remaining[p.id] > 0
                        )
                        .map(p => p.at)
                );


            gantt.push({

                id: "IDLE",

                start: time,

                end: next

            });


            time = next;

            continue;

        }


        const p =
            available.sort(
                (a, b) =>
                    a.pr - b.pr ||
                    a.at - b.at ||
                    a.index - b.index
            )[0];


        if (last !== p.id) {

            if (last !== null) {

                gantt.push({

                    id: last,

                    start: start,

                    end: time

                });

            }


            last = p.id;

            start = time;

        }


        remaining[p.id]--;

        time++;


        if (remaining[p.id] === 0) {

            ct[p.id] = time;

            completed++;

        }

    }


    if (last !== null) {

        gantt.push({

            id: last,

            start: start,

            end: time

        });

    }


    return {

        rows:
            finishRows(ps, ct),

        g: gantt

    };

}



/* =========================
   ROUND ROBIN
========================= */

function rr(ps, quantum) {

    const arr =
        [...ps].sort(
            (a, b) =>
                a.at - b.at ||
                a.index - b.index
        );


    const remaining =
        Object.fromEntries(
            ps.map(
                p => [p.id, p.bt]
            )
        );


    const ct = {};

    const gantt = [];

    const queue = [];


    let time = 0;

    let i = 0;


    while (
        Object.keys(ct).length
        < ps.length
    ) {

        while (
            i < arr.length &&
            arr[i].at <= time
        ) {

            queue.push(arr[i]);

            i++;

        }


        if (!queue.length) {

            const next = arr[i].at;


            gantt.push({

                id: "IDLE",

                start: time,

                end: next

            });


            time = next;

            continue;

        }


        const p = queue.shift();


        const start = time;


        const run =
            Math.min(
                quantum,
                remaining[p.id]
            );


        time += run;


        remaining[p.id] -= run;


        gantt.push({

            id: p.id,

            start: start,

            end: time

        });


        while (
            i < arr.length &&
            arr[i].at <= time
        ) {

            queue.push(arr[i]);

            i++;

        }


        if (remaining[p.id] > 0) {

            queue.push(p);

        } else {

            ct[p.id] = time;

        }

    }


    return {

        rows:
            finishRows(ps, ct),

        g: gantt

    };

}



/* =========================
   CALCULATE
========================= */

function calculate(name, result) {

    const averageWT =
        avg(
            result.rows.map(
                x => x.wt
            )
        );


    const averageTAT =
        avg(
            result.rows.map(
                x => x.tat
            )
        );


    const averageCT =
        avg(
            result.rows.map(
                x => x.ct
            )
        );


    return {

        ...result,

        name,

        aw: averageWT,

        at: averageTAT,

        ac: averageCT

    };

}



/* =========================
   RUN
========================= */

function run() {

    const processes =
        getProcesses();


    if (!processes.length) {

        alert(
            "Please add at least one process."
        );

        return;

    }


    const quantum =
        Math.max(
            1,
            +document.querySelector(
                "#quantum"
            ).value || 1
        );


    const preemptive =
        document.querySelector(
            "#preemptivePriority"
        ).checked;


    results = {

        FCFS:
            calculate(
                "FCFS",
                fcfs(processes)
            ),

        SJF:
            calculate(
                "SJF",
                sjf(processes)
            ),

        "Round Robin":
            calculate(
                "Round Robin",
                rr(
                    processes,
                    quantum
                )
            ),

        Priority:
            calculate(
                "Priority",
                priority(
                    processes,
                    preemptive
                )
            )

    };


    render();

}



/* =========================
   RENDER
========================= */

function render() {

    const names =
        Object.keys(results);


    const best =
        names.reduce(
            (a, b) =>
                results[a].aw <
                results[b].aw
                    ? a
                    : b
        );


    const bestTAT =
        names.reduce(
            (a, b) =>
                results[a].at <
                results[b].at
                    ? a
                    : b
        );


    document.querySelector(
        "#bestAlgo"
    ).textContent = best;


    document.querySelector(
        "#bestWT"
    ).textContent =
        results[best]
            .aw
            .toFixed(2);


    document.querySelector(
        "#bestTAT"
    ).textContent =
        results[bestTAT]
            .at
            .toFixed(2);


    document.querySelector(
        "#count"
    ).textContent =
        getProcesses().length;



    /* WINNER */

    const winner =
        document.querySelector(
            "#winner"
        );


    winner.classList.remove(
        "hidden"
    );


    winner.innerHTML = `

        <h3>
            🏆 Best Overall:
            <strong>
                ${best}
            </strong>
        </h3>

        <p>

            Lowest Average Waiting Time:
            <strong>
                ${results[best].aw.toFixed(2)}
            </strong>

            &nbsp; | &nbsp;

            Lowest Average Turnaround Time:
            <strong>
                ${results[bestTAT].at.toFixed(2)}
            </strong>

        </p>

    `;



    /* SUMMARY */

    summaryBody.innerHTML = "";


    names.forEach(name => {

        const r =
            results[name];


        const tr =
            document.createElement(
                "tr"
            );


        tr.innerHTML = `

            <td>
                <b>${name}</b>
            </td>

            <td>
                ${r.aw.toFixed(2)}
            </td>

            <td>
                ${r.at.toFixed(2)}
            </td>

            <td>
                ${r.ac.toFixed(2)}
            </td>

            <td>

                <span class="badge
                    ${name === best
                        ? "best"
                        : ""}">

                    ${
                        name === best
                            ? "★ BEST"
                            : "COMPARE"
                    }

                </span>

            </td>

        `;


        summaryBody.appendChild(tr);

    });



    /* DETAIL SELECT */

    detailAlgo.innerHTML =
        names
            .map(
                n =>
                    `<option>${n}</option>`
            )
            .join("");


    detailAlgo.onchange =
        renderDetails;


    renderDetails();

    renderTimelines();

    drawChart();

}



/* =========================
   DETAILS
========================= */

function renderDetails() {

    const result =
        results[
            detailAlgo.value
        ];


    detailBody.innerHTML =
        result.rows
            .sort(
                (a, b) =>
                    a.index - b.index
            )
            .map(
                x => `

                <tr>

                    <td>
                        <b>${x.id}</b>
                    </td>

                    <td>${x.at}</td>

                    <td>${x.bt}</td>

                    <td>${x.pr}</td>

                    <td>${x.ct}</td>

                    <td>
                        ${x.tat}
                    </td>

                    <td>
                        ${x.wt}
                    </td>

                </tr>

            `
            )
            .join("");

}



/* =========================
   GANTT CHART
========================= */

function renderTimelines() {

    timelines.innerHTML =
        Object.entries(results)
            .map(
                ([name, result]) => {

                    const max =
                        Math.max(
                            ...result.g.map(
                                x => x.end
                            ),
                            1
                        );


                    return `

                    <div class="timeline">

                        <div class="timeline-title">

                            <b>
                                ${name}
                            </b>

                            <span>

                                Avg WT:
                                ${result.aw.toFixed(2)}

                                • Avg TAT:
                                ${result.at.toFixed(2)}

                            </span>

                        </div>


                        <div class="gantt">

                            ${result.g
                                .map(
                                    (x, i) => `

                                    <div
                                        class="block
                                            ${
                                                x.id === "IDLE"
                                                    ? "idle"
                                                    : colors[
                                                        i %
                                                        colors.length
                                                    ]
                                            }"
                                        style="
                                            width:
                                            ${
                                                (
                                                    (x.end - x.start)
                                                    /
                                                    max
                                                ) * 100
                                            }%;
                                        "
                                    >

                                        ${x.id}

                                        <small>
                                            ${x.start}–${x.end}
                                        </small>

                                    </div>

                                `
                                )
                                .join("")}

                        </div>

                    </div>

                    `;

                }
            )
            .join("");

}



/* =========================
   BAR CHART
========================= */

function drawChart() {

    const canvas =
        document.querySelector(
            "#comparisonChart"
        );


    const ctx =
        canvas.getContext("2d");


    const dpr =
        window.devicePixelRatio || 1;


    const width =
        canvas.clientWidth;


    const height =
        canvas.clientHeight;


    canvas.width =
        width * dpr;


    canvas.height =
        height * dpr;


    ctx.scale(dpr, dpr);


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    const names =
        Object.keys(results);


    const max =
        Math.max(
            ...names.flatMap(
                name => [
                    results[name].aw,
                    results[name].at
                ]
            ),
            1
        );


    const padding = {

        left: 55,

        right: 25,

        top: 25,

        bottom: 45

    };


    const chartWidth =
        width -
        padding.left -
        padding.right;


    const chartHeight =
        height -
        padding.top -
        padding.bottom;


    const base =
        height -
        padding.bottom;


    const columnWidth =
        chartWidth /
        names.length;


    ctx.font =
        "12px system-ui";


    ctx.textAlign =
        "center";


    /* GRID */

    [0, .25, .5, .75, 1]
        .forEach(value => {

            const y =
                base -
                chartHeight *
                value;


            ctx.strokeStyle =
                "#25304a";


            ctx.beginPath();


            ctx.moveTo(
                padding.left,
                y
            );


            ctx.lineTo(
                width -
                padding.right,
                y
            );


            ctx.stroke();


            ctx.fillStyle =
                "#68758e";


            ctx.fillText(
                (max * value)
                    .toFixed(1),

                25,

                y + 4
            );

        });



    /* BARS */

    names.forEach(
        (name, index) => {

            const x =
                padding.left +
                columnWidth *
                index +
                columnWidth / 2;


            const wt =
                results[name].aw;


            const tat =
                results[name].at;


            const barWidth =
                Math.min(
                    34,
                    columnWidth / 4
                );


            const scale =
                chartHeight / max;


            const wtHeight =
                wt * scale;


            const tatHeight =
                tat * scale;


            ctx.fillStyle =
                "#6c63ff";


            ctx.beginPath();


            ctx.roundRect(
                x - barWidth - 4,

                base - wtHeight,

                barWidth,

                wtHeight,

                7
            );


            ctx.fill();



            ctx.fillStyle =
                "#24d8ff";


            ctx.beginPath();


            ctx.roundRect(
                x + 4,

                base - tatHeight,

                barWidth,

                tatHeight,

                7
            );


            ctx.fill();



            ctx.fillStyle =
                "#c3cee3";


            ctx.fillText(

                name === "Round Robin"
                    ? "RR"
                    : name,

                x,

                base + 24

            );

        }

    );

}



/* =========================
   BUTTON EVENTS
========================= */

document.querySelector(
    "#addBtn"
).onclick = () => {

    addProcess();

};


document.querySelector(
    "#sampleBtn"
).onclick = () => {

    loadSample();

    run();

};


document.querySelector(
    "#runBtn"
).onclick = run;


window.addEventListener(
    "resize",
    () => {

        if (
            Object.keys(results)
                .length
        ) {

            drawChart();

        }

    }
);



/* =========================
   START
========================= */

loadSample();

run();