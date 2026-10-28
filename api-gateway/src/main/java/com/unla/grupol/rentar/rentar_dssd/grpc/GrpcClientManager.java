package com.unla.grupol.rentar.rentar_dssd.grpc;

import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.stereotype.Service;

import customer.CustomerServiceGrpc;
import rental.RentalServiceGrpc;
import com.unla.grupol.rentar.grpc.vehicle.VehicleServiceGrpc;

@Service
public class GrpcClientManager {

    @GrpcClient("customer-service")
    private CustomerServiceGrpc.CustomerServiceBlockingStub customerStub;

    @GrpcClient("vehicle-service")
    private VehicleServiceGrpc.VehicleServiceBlockingStub vehicleStub;

    @GrpcClient("rental-service")
    private RentalServiceGrpc.RentalServiceBlockingStub rentalStub;

    public CustomerServiceGrpc.CustomerServiceBlockingStub getCustomerStub() {
        return customerStub;
    }

    public VehicleServiceGrpc.VehicleServiceBlockingStub getVehicleStub() {
        return vehicleStub;
    }

    public RentalServiceGrpc.RentalServiceBlockingStub getRentalStub() {
        return rentalStub;
    }
}