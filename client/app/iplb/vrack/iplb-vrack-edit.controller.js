class IpLoadBalancerVrackEditCtrl {
    constructor ($q, $stateParams, $translate, CloudMessage, CloudNavigation, ControllerHelper, IpLoadBalancerServerFarmService, IpLoadBalancerVrackService) {
        this.$q = $q;
        this.$stateParams = $stateParams;
        this.$translate = $translate;
        this.CloudMessage = CloudMessage;
        this.CloudNavigation = CloudNavigation;
        this.ControllerHelper = ControllerHelper;
        this.IpLoadBalancerServerFarmService = IpLoadBalancerServerFarmService;
        this.IpLoadBalancerVrackService = IpLoadBalancerVrackService;

        this.serviceName = $stateParams.serviceName;
        this.networkId = $stateParams.networkId;

        this._initLoaders();
        this._initModel();
    }

    $onInit () {
        this.previousState = this.CloudNavigation.getPreviousState();
        this.creationRules.load();
        this.privateNetwork.load()
            .then(() => {
                if (_.keys(this.privateNetwork.data).length) {
                    _.forEach(_.keys(this.model), key => {
                        this.model[key].value = this.privateNetwork.data[key];
                    });
                }

                return this.privateNetworkFarms.load();
            })
            .then(() => {
                if (!this.privateNetworkFarms.data.length) {
                    this.addFarm();
                    return;
                }

                _.forEach(this.privateNetworkFarms.data, farm => {
                    farm.displayName = farm.displayName || farm.farmId;
                });
                this.model.farmId.value = this.privateNetworkFarms.data;
            });

        this.farms.load()
            .then(() => {
                _.forEach(this.farms.data, farm => {
                    farm.displayName = farm.displayName || farm.farmId;
                });
            });
    }

    submit () {
        if (this.form.$invalid) {
            return this.$q.reject();
        }

        this.CloudMessage.flushChildMessage();
        return (!this.editing() ? this._addNetwork() : this._editNetwork())
            .then(() => this.previousState.go());
    }

    isLoading () {
        return this.privateNetwork.loading || this.creationRules.loading;
    }

    editing () {
        return this.networkId;
    }

    loading () {
        return this.creationRules.loading || this.privateNetwork.loading;
    }

    getAvailableFarm (forceValue) {
        const filteredValue = _.filter(this.farms.data, farm => !_.includes(_.map(this.model.farmId.value, value => value.farmId), farm.farmId));
        if (forceValue) {
            filteredValue.push(_.find(this.farms.data, farm => farm.farmId === forceValue));
        }
        return filteredValue;
    }

    canAddFarm () {
        const availableFarmCount = this.getAvailableFarm().length;
        return availableFarmCount > 0 && this.model.farmId.value.length < this.farms.data.length;
    }

    addFarm () {
        this.model.farmId.value.push({
            farmId: null,
            displayName: null
        });
    }

    removeFarm (index) {
        this.model.farmId.value.splice(index, 1);
    }

    _addNetwork () {
        return this.IpLoadBalancerVrackService.addPrivateNetwork(this.serviceName, this._getCleanModel());
    }

    _editNetwork () {
        return this.IpLoadBalancerVrackService.editPrivateNetwork(this.serviceName, this._getCleanModel());
    }

    _getCleanModel () {
        const cleanModel = {};
        _.forEach(_.keys(this.model), key => {
            if (!this.model[key].disabled()) {
                switch (key) {
                    case "farmId":
                        cleanModel[key] = _.map(_.filter(this.model[key].value, farm => farm.farmId), farm => farm.farmId);
                        break;
                    default:
                        cleanModel[key] = this.model[key].value;
                }
            }
        });

        cleanModel.vrackNetworkId = this.networkId;
        return cleanModel;
    }

    _initLoaders () {
        this.creationRules = this.ControllerHelper.request.getHashLoader({
            loaderFunction: () => this.IpLoadBalancerVrackService.getNetworkCreationRules(this.serviceName)
        });

        this.privateNetwork = this.ControllerHelper.request.getHashLoader({
            loaderFunction: () => this.editing() ? this.IpLoadBalancerVrackService.getPrivateNetwork(this.serviceName, this.networkId) : this.$q.when({})
        });

        this.privateNetworkFarms = this.ControllerHelper.request.getHashLoader({
            loaderFunction: () => this.editing() ? this.IpLoadBalancerVrackService.getPrivateNetworkFarms(this.serviceName, this.networkId) : this.$q.when([])
        });

        this.farms = this.ControllerHelper.request.getArrayLoader({
            loaderFunction: () => this.IpLoadBalancerServerFarmService.getServerFarms(this.serviceName)
        });
    }

    _initModel () {
        this.model = {
            displayName: {
                id: "displayName",
                label: this.$translate.instant("iplb_vrack_private_network_add_edit_field_display_name_label"),
                type: "text",
                value: undefined,
                required: false,
                minLength: 0,
                maxLength: 100,
                disabled: () => this.creationRules.data.status !== "active",
                inputSize: 4
            },
            vlan: {
                id: "vlan",
                label: this.$translate.instant("iplb_vrack_private_network_add_edit_field_vlan_label"),
                type: "number",
                value: undefined,
                required: false,
                minLength: 0,
                maxLength: Infinity,
                disabled: () => this.creationRules.data.status !== "active",
                helperText: this.$translate.instant("iplb_vrack_private_network_add_edit_field_vlan_helper"),
                inputSize: 1
            },
            subnet: {
                id: "subnet",
                label: this.$translate.instant("iplb_vrack_private_network_add_edit_field_subnet_label"),
                type: "text",
                value: undefined,
                required: true,
                minLength: 0,
                maxLength: Infinity,
                disabled: () => this.editing() && this.creationRules.data.status !== "active",
                helperText: this.$translate.instant("iplb_vrack_private_network_add_edit_field_subnet_helper"),
                inputSize: 2
            },
            natIp: {
                id: "natIp",
                label: this.$translate.instant("iplb_vrack_private_network_add_edit_field_nat_ip_label"),
                type: "text",
                value: undefined,
                required: true,
                minLength: 0,
                maxLength: Infinity,
                disabled: () => this.creationRules.data.status !== "active",
                helperText: this.$translate.instant("iplb_vrack_private_network_add_edit_field_nat_ip_helper"),
                inputSize: 2
            },
            farmId: {
                label: this.$translate.instant("iplb_vrack_private_network_add_edit_field_farm_label"),
                value: [],
                disabled: () => false
            }
        };
    }
}

angular.module("managerApp").controller("IpLoadBalancerVrackEditCtrl", IpLoadBalancerVrackEditCtrl);