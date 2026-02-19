package com.quickcatalog.entity.enums;

public enum UnitType {

    PCS("Pieces"),
    KG("Kilograms"),
    GM("Grams"),
    LTR("Litres"),
    ML("Millilitres"),
    MTR("Metres"),
    CM("Centimetres"),
    BOX("Box"),
    SET("Set"),
    PAIR("Pair"),
    DOZEN("Dozen"),
    PACK("Pack"),
    ROLL("Roll"),
    SQ_FT("Square Feet"),
    SQ_MTR("Square Metres");

    private final String displayName;

    UnitType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
