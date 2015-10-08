var CurrencyProvider = function() {
    this.allCurrencies = ["EUR", "GBP", "INR", "JPY", "USD"];

    var self = this;
    this.serviceId = 0;
    this.hostCurrency = "INR";
    this.numberFormat = "ENGLISH";
    this.isToggledOff = true;
    this.selectedCurrencies = ["EUR", "GBP", "INR", "JPY", "USD"];
    this.currencyMetadata = {
        USD: {
            currencyName: "United States dollar",
            currencySymbol: "$",
            id: "USD"
        },
        GBP: {
            currencyName: "Great Briton Pound",
            currencySymbol: "£",
            id: "GBP"
        },
        INR: {
            currencyName: "Indian Rupee",
            currencySymbol: "₹",
            id: "INR"
        },
        JPY: {
            currencyName: "Japanese Yen",
            currencySymbol: "¥",
            id: "JPY"
        },
        EUR: {
            currencyName: "Euro",
            currencySymbol: "€",
            id: "EUR"
        }
    };

    this.init = function() {
        chrome.storage.sync.get(function(dataObject) {
            if(!dataObject.data)
                return;
            self.hostCurrency = dataObject.data.hostCurrency;
            self.selectedCurrencies = dataObject.data.selectedCurrencies;
            self.numberFormat = dataObject.data.numberFormat;
            self.updateCurrencyInfo();
        });
    }

    this.updateCurrencyInfo = function() {
        console.log("fetching rates from http://api.fixer.io/...");
        var requestUrl = "http://api.fixer.io/latest?base=" + self.hostCurrency;

        $.ajax({
            url: requestUrl,
            success: function(jsonResponse) {
            var results = jsonResponse.rates
                for(var index in self.selectedCurrencies) {
                    var key = self.selectedCurrencies[index];
                    if(results[key]) {
                        self.currencyMetadata[key].conversion = results[key];
                    }
                }
                self.currencyMetadata[self.hostCurrency].conversion = 1;
            }
        });
    }

    this.makePersistent = function() {
        chrome.storage.sync.set({
            data: {
                hostCurrency: self.hostCurrency,
                selectedCurrencies: self.selectedCurrencies,
                numberFormat: self.numberFormat
            }
        });
    }

    this.startRefreshService = function() {
        self.updateCurrencyInfo();
        self.serviceId = setInterval(self.updateCurrencyInfo, 900000);
    }
    this.init();
}

var currencyProvider = new CurrencyProvider();
currencyProvider.startRefreshService();


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.query == "CurrencyRate") {
            sendResponse({
                currencyMetadata: currencyProvider.currencyMetadata,
                hostCurrency: currencyProvider.hostCurrency,
                numberFormat: currencyProvider.numberFormat,
                isToggledOff: currencyProvider.isToggledOff
            });
        }
        if (request.query == "Preferences") {
            sendResponse({
                allCurrencies: currencyProvider.allCurrencies,
                selectedCurrencies: currencyProvider.selectedCurrencies,
                hostCurrency: currencyProvider.hostCurrency,
                numberFormat: currencyProvider.numberFormat,
                isToggledOff: currencyProvider.isToggledOff
            });
        }
        if (request.query == "DataUpdate") {
            currencyProvider.selectedCurrencies = request.data.selectedCurrencies;
            currencyProvider.hostCurrency = request.data.hostCurrency;
            currencyProvider.numberFormat = request.data.numberFormat;
            currencyProvider.isToggledOff = request.data.isToggledOff;
            currencyProvider.makePersistent();
            currencyProvider.updateCurrencyInfo();
        }
});