FROM maven:3.9-eclipse-temurin-17 AS build

WORKDIR /build
COPY api-gateway/pom.xml ./
COPY api-gateway/src ./src

RUN mvn -B -ntp clean package -DskipTests \
    && cp target/rentar-dssd-*.jar /build/app.jar

FROM eclipse-temurin:17-jre-jammy

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY --from=build /build/app.jar ./app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
