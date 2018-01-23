class IpLoadBalancerZoneAddService {
    constructor ($q, $translate, $window, CloudMessage, OrderHelperService, OvhApiIpLoadBalancing, RegionService, ServiceHelper) {
        this.$q = $q;
        this.$translate = $translate;
        this.$window = $window;
        this.CloudMessage = CloudMessage;
        this.OrderHelperService = OrderHelperService;
        this.OvhApiIpLoadBalancing = OvhApiIpLoadBalancing;
        this.RegionService = RegionService;
        this.ServiceHelper = ServiceHelper;
    }

    getOrderableZones (serviceName) {
        return this.OvhApiIpLoadBalancing.Lexi().get({ serviceName })
            .$promise
            .then(response => _.map(response.orderableZone, zone => _.extend(zone, this.RegionService.getRegion(zone.name))))
            .catch(this.ServiceHelper.errorHandler("iplb_zone_add_loading_error"));
    }

    addZones (serviceName, zones) {
        if (zones.length === 0) {
            return this.ServiceHelper.errorHandler("iplb_zone_add_selection_error")({});
        }

        return this.OrderHelperService.getExpressOrderUrl(_.map(zones, zone => ({
            productId: "ipLoadbalancing",
            serviceName,
            planCode: zone.planCode
        })))
            .then(response => {
                this.$window.open(response, "_blank");

                return this.ServiceHelper.successHandler({
                    text: this.$translate.instant(zones.length > 1 ? "iplb_zone_add_plural_success" : "iplb_zone_add_single_success"),
                    link: {
                        text: this.$translate.instant("common_complete_order"),
                        value: response
                    }
                })(response);
            })
            .catch(this.ServiceHelper.errorHandler(zones.length > 1 ? "iplb_zone_add_plural_error" : "iplb_zone_add_single_error"));
    }
}

angular.module("managerApp").service("IpLoadBalancerZoneAddService", IpLoadBalancerZoneAddService);