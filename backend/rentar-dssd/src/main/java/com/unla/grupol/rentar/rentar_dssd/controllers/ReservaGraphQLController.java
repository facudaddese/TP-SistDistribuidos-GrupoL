package com.unla.grupol.rentar.rentar_dssd.controllers;

import com.unla.grupol.rentar.rentar_dssd.grpc.GrpcClientManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

@Controller
public class ReservaGraphQLController {

  @Autowired
  private GrpcClientManager grpcClients;

  @QueryMapping
  public String pingGateway() {
    return "El API Gateway esta activo y listo para gRPC";
  }
}