const PARAMETERS_ELEMENT = document.getElementById("parameters");

const REFRACTION_PARAMETERS = `
    <div class="row">
        <div>
            <label for="n_a">n<sub>a</sub> = </label>
            <input type="number" id="n_a" min="0.1" step="0.1" value="1" />
        </div>
        <div>
            <label for="n_b">n<sub>b</sub> = </label>
            <input type="number" id="n_b" min="0.1" step="0.1" value="1.3" />
        </div>
    </div>
    <div>
        <label for="drawSpeed">Drawing speed: </label>
        <input type="number" id="drawSpeed" min="0.01" max="3" step="0.1" value="0.1" />
    </div>
    <div>
        <label for="numRays">Number of rays: </label>
        <input type="number" id="numRays" min="5" step="1" value="34" />
    </div>
    <div class="row">
        <div>
            <span>θ<sub>a</sub> = </span>
            <span id="theta_a"> - </span>
            <span>°</span>
        </div>
        <div>
            <span>θ<sub>b</sub> = </span>
            <span id="theta_b"> - </span>
            <span>°</span>
        </div>
    </div>
`

const SPHERICAL_MIRROR_PARAMETERS = `
    <div>
        <label for="mirrorRadius">Mirror radius = </label>
        <input type="number" id="mirrorRadius" min="-3" max="3" step="0.5" value="1" />
    </div>
    <div>
        <label for="drawSpeed">Drawing speed: </label>
        <input type="number" id="drawSpeed" min="0.01" max="3" step="0.1" value="0.1" />
    </div>
    <div>
        <label for="numRays">Number of rays: </label>
        <input type="number" id="numRays" min="5" step="1" value="34" />
    </div>
`

updateParameters();

function updateParameters() {
    switch (curModelType) {
        case REFRACTION: 
            PARAMETERS_ELEMENT.innerHTML = REFRACTION_PARAMETERS;

            thetaAElement = document.getElementById("theta_a");
            thetaBElement = document.getElementById("theta_b");

            updateValuesFromInput();
            break;
        case SPHERICAL_MIRROR:
            PARAMETERS_ELEMENT.innerHTML = SPHERICAL_MIRROR_PARAMETERS;
    }
}