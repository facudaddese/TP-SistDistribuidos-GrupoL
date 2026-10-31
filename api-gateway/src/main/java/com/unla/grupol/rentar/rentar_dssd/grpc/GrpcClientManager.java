package com.unla.grupol.rentar.rentar_dssd.grpc;

import net.devh.boot.grpc.client.inject.GrpcClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

import customer.CustomerServiceGrpc;
import rental.RentalServiceGrpc;
import com.unla.grupol.rentar.grpc.vehicle.VehicleServiceGrpc;

@Service
public class GrpcClientManager {

    @Value("${grpc.deadline-seconds:5}")
    private long deadlineSeconds;

    @GrpcClient("customer-service")
    private CustomerServiceGrpc.CustomerServiceBlockingStub customerStub;

    @GrpcClient("vehicle-service")
    private VehicleServiceGrpc.VehicleServiceBlockingStub vehicleStub;

    @GrpcClient("rental-service")
    private RentalServiceGrpc.RentalServiceBlockingStub rentalStub;

    public CustomerServiceGrpc.CustomerServiceBlockingStub getCustomerStub() {
        return customerStub != null
                ? customerStub.withDeadlineAfter(deadlineSeconds, TimeUnit.SECONDS)
                : null;
    }

    public VehicleServiceGrpc.VehicleServiceBlockingStub getVehicleStub() {
        return vehicleStub != null
                ? vehicleStub.withDeadlineAfter(deadlineSeconds, TimeUnit.SECONDS)
                : null;
    }

    public RentalServiceGrpc.RentalServiceBlockingStub getRentalStub() {
        return rentalStub != null
                ? rentalStub.withDeadlineAfter(deadlineSeconds, TimeUnit.SECONDS)
                : null;
    }
}