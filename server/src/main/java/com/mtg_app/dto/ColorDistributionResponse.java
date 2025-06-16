package com.mtg_app.dto;

import org.springframework.stereotype.Component;

@Component
public class ColorDistributionResponse {
    private double white;
    private double blue;
    private double black;
    private double red;
    private double green;

    public ColorDistributionResponse() {};

    public ColorDistributionResponse(double white, double blue, double black, double red, double green) {
        this.white = white;
        this.blue = blue;
        this.black = black;
        this.red = red;
        this.green = green;
    }

    public double getWhite() {
        return white;
    }

    public void setWhite(double white) {
        this.white = white;
    }

    public double getBlue() {
        return blue;
    }

    public void setBlue(double blue) {
        this.blue = blue;
    }

    public double getBlack() {
        return black;
    }

    public void setBlack(double black) {
        this.black = black;
    }

    public double getRed() {
        return red;
    }

    public void setRed(double red) {
        this.red = red;
    }

    public double getGreen() {
        return green;
    }

    public void setGreen(double green) {
        this.green = green;
    }

    @Override
    public String toString() {
        return "ColorDistributionResponse{" +
                "white=" + white +
                ", blue=" + blue +
                ", black=" + black +
                ", red=" + red +
                ", green=" + green +
                '}';
    }
    
}
