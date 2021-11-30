$(document).ready(function () {
    const view = new MainView();
    const model = new MainModel();
    const controller = new MainController(model, view);
    controller.addHandle();
    controller.findMyLocation();
    controller.showMyCities();

    $(document).mouseup(function (e) {
        var div = $("#listForm");
        if (!div.is(e.target)
            && div.has(e.target).length === 0) {
            $("#cities_found").hide();
        }
    });
})

class MainView {
    constructor() {
        this.$findButton = $("#findButton");
        this.$currentPosition = $("#current_position");
        this.$addCity;
        this.$deleteCity = [];
    }

    showCities(array) {
        let $cities = $("#cities_found");
        $cities.html("");
        $cities.show();
        if (array.length === 0) {
            let li = $("<li></li>").text("No results found");
            $cities.append(li);
        }

        else for (let i = 0; i < array.length; i++) {
            let flag = false;
            let li = $("<li></li>").text(array[i].name + ", " + (array[i].state !== "" ? array[i].state + ", " : "") + array[i].country);
            let button = $(`<button id=${array[i].id} class='addCity'></button>`).text("Add");
            for (let j = 0; j < this.$deleteCity.length; j++) {
                if (array[i].id === Number.parseInt(this.$deleteCity[j].getAttribute("class").split(' ')[0])) {
                    flag = true;
                }
            }
            if (flag === false) li.append(button);
            $cities.append(li);
            this.$addCity = $('.addCity');
        }
    }

    showMyCities(array) {
        let $myCities = $("#my_cities");
        $myCities.html("");
        if (array.length === 0) {
            let li = $("<li></li>").text("Add some cities to show");
            $myCities.append(li);
        }

        else for (let i = 0; i < array.length; i++) {
            let weather = array[i].weather.charAt(0).toUpperCase() + array[i].weather.slice(1);
            let li = $("<li></li>").html(`${array[i].city}, ${array[i].country}</br><img src="https://openweathermap.org/img/wn/${array[i].icon}.png"> ${weather}</br>Temperature: ${array[i].temperature}°C</br>Wind speed: ${array[i].wind}m/s</br>`);
            let buttonDelete = $(`<button class="${array[i].id} deleteButton"></button>`).text("Delete");
            li.append(buttonDelete);
            $myCities.append(li);
            this.$deleteCity = $('.deleteButton');
        }
    }

    showMyWeather(myWeather) {
        let weather = myWeather.weather.charAt(0).toUpperCase() + myWeather.weather.slice(1);
        let $myPostion = $("#current_position");
        $myPostion.html(`${myWeather.city}, ${myWeather.country}</br><img src="https://openweathermap.org/img/wn/${myWeather.icon}.png"> ${weather}</br>Temperature: ${myWeather.temperature}°C</br>Wind speed: ${myWeather.wind}m/s</br>`);
    }
}

class MainController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.findCities = this.findCities.bind(this);
        this.addCity = this.addCity.bind(this);
        this.deleteCity = this.deleteCity.bind(this);
    }

    addHandle() {
        this.view.$findButton.on("click", this.findCities);
    }

    async findCities() {
        let text = $("#inputCity").val();
        if (text !== "") {
            let array = await this.model.findCities(text);
            this.view.showCities(array);
            if (array.length !== 0) this.view.$addCity.on("click", this.addCity);
        }
    }

    async addCity(e) {
        let id = e.target.id;
        await this.model.addCity(id);
        this.showMyCities();
        $(e.target).css('display', 'none');
    }

    async deleteCity(e) {
        let id = e.target.getAttribute("class").split(' ')[0];
        await this.model.deleteCity(id);
        this.showMyCities();
    }

    async findMyLocation() {
        let [lat, lon] = await this.model.findMe();
        let myWeather = await this.model.myWeather(lat, lon);
        this.view.showMyWeather(myWeather);
    }

    async showMyCities() {
        let array = await this.model.getMyCitiesWeather();
        this.view.showMyCities(array);
        if (array.length > 0) this.view.$deleteCity.on("click", this.deleteCity);
    }
}

class MainModel {
    constructor() {
        this.url = 'http://localhost:3000/';
    }

    findCities(name) {
        return fetch(this.url + "city/" + name[0].toUpperCase() + name.slice(1))
            .then((response) => response.json())
            .then((text) => text.result);
    }

    findMe() {
        return new Promise(function (resolve) {
            $.ajax({
                url: "https://geolocation-db.com/jsonp",
                jsonpCallback: "callback",
                dataType: "jsonp",
                success: function (location) {
                    let lat = location.latitude;
                    let lon = location.longitude;
                    resolve([lat, lon]);
                }
            });
        });
    }

    myWeather(lat, lon) {
        return fetch(this.url + lat + ',' + lon)
            .then((response) => response.json());
    }

    async addCity(id) {
        try {
            let result = await fetch(this.url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: id })
            });
            let json = await result.json();
            return json;
        } catch (err) {
            return err;
        }
    }

    async deleteCity(id) {
        try {
            let result = await fetch(this.url + id, {
                method: 'DELETE',
            });
            let json = await result.json();
            return json;
        } catch (err) {
            return err;
        }
    }

    getMyCitiesWeather() {
        return fetch(this.url + "myCities/")
            .then((response) => response.json());
    }
}